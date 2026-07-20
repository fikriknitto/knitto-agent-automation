import { mkdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import puppeteer, { type Browser, type Page } from "puppeteer";
import { ToolError } from "../../mcp-kit/core/index.js";
import { getAutomationJobId } from "../job-context.js";
import config from "../config.js";
import { isJobSegmentManaged } from "../../../core/evidence/segment-context.js";
import { ensureSegmentRecordingStarted } from "../../../core/evidence/segment-recording.js";
import {
  acquireBrowserLock,
  clearBrowserLock,
  releaseBrowserLock,
} from "../../../core/evidence/browser-lock.js";
import {
  ensureBrowserSegmentRecording,
  startJobRecording,
  stopJobRecording,
} from "./recording.js";

export function isRecordablePageUrl(url: string): boolean {
  const trimmed = url.trim();
  return trimmed !== "" && trimmed !== "about:blank";
}

export function getOpenPage(): Page | null {
  if (page && !page.isClosed()) return page;
  return null;
}

let browser: Browser | null = null;
let page: Page | null = null;

const BROWSER_STATE_DIR = join(tmpdir(), "knitto-automation-browser");
const BROWSER_STATE_FILE = join(BROWSER_STATE_DIR, "state.json");

type BrowserState = { wsEndpoint: string };

function writeBrowserState(wsEndpoint: string): void {
  try {
    mkdirSync(BROWSER_STATE_DIR, { recursive: true });
    writeFileSync(BROWSER_STATE_FILE, JSON.stringify({ wsEndpoint } satisfies BrowserState));
  } catch {
    // ignore — cleanup is best-effort
  }
}

function clearBrowserState(): void {
  try {
    unlinkSync(BROWSER_STATE_FILE);
  } catch {
    // ignore
  }
}

/** Reconnect to a live browser from state.json (Cursor multi-TC reuse). */
export async function connectBrowserFromStateFile(): Promise<Browser | null> {
  let state: BrowserState;
  try {
    state = JSON.parse(readFileSync(BROWSER_STATE_FILE, "utf8")) as BrowserState;
  } catch {
    return null;
  }

  if (!state.wsEndpoint) return null;

  try {
    const connected = await puppeteer.connect({ browserWSEndpoint: state.wsEndpoint });
    if (!connected.connected) {
      await connected.disconnect().catch(() => undefined);
      return null;
    }
    browser = connected;
    const pages = await connected.pages();
    page = pages.find((p) => !p.isClosed()) ?? pages[0] ?? null;
    return connected;
  } catch {
    return null;
  }
}

async function launchBrowser(): Promise<Browser> {
  const jobId = getAutomationJobId();
  if (jobId) {
    acquireBrowserLock(jobId);
  }

  if (browser?.connected) return browser;

  const reconnected = await connectBrowserFromStateFile();
  if (reconnected) return reconnected;

  browser = await puppeteer.launch({
    headless: config.headless,
    slowMo: config.slowMoMs > 0 ? config.slowMoMs : undefined,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH?.trim() || undefined,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
    ],
  });
  writeBrowserState(browser.wsEndpoint());
  process.on("exit", () => {
    void browser?.close().catch(() => undefined);
  });
  return browser;
}

async function startRecordingForPage(page: Page): Promise<void> {
  const jobId = getAutomationJobId();
  if (!jobId) return;

  if (isJobSegmentManaged(jobId)) {
    if (!isRecordablePageUrl(page.url())) return;
    await ensureBrowserSegmentRecording(page, jobId);
  } else {
    await startJobRecording(page);
  }
}

export async function getPage(): Promise<Page> {
  const jobId = getAutomationJobId();
  if (jobId) {
    acquireBrowserLock(jobId);
  }

  if (page && !page.isClosed()) {
    if (jobId) {
      await startRecordingForPage(page);
    }
    return page;
  }
  const b = await launchBrowser();
  const pages = await b.pages();
  page = pages[0] ?? (await b.newPage());
  await page.setViewport({
    width: config.viewportWidth,
    height: config.viewportHeight,
  });
  page.setDefaultTimeout(config.browserTimeoutMs);
  if (jobId && !isJobSegmentManaged(jobId)) {
    await startRecordingForPage(page);
  }
  return page;
}

export async function navigatePage(
  url: string,
  waitUntil: "load" | "domcontentloaded" | "networkidle0" | "networkidle2"
): Promise<{ url: string; title: string }> {
  const p = await getPage();
  await p.goto(url, { waitUntil, timeout: config.browserTimeoutMs });
  const jobId = getAutomationJobId();
  if (jobId && isJobSegmentManaged(jobId)) {
    await ensureSegmentRecordingStarted(jobId);
  }
  return { url: p.url(), title: await p.title() };
}

export async function getPageText(): Promise<string> {
  const p = await getPage();
  return p.evaluate(() => document.body?.innerText ?? "");
}

export async function goBack(): Promise<{ url: string; title: string }> {
  const p = await getPage();
  await p.goBack({ waitUntil: "domcontentloaded", timeout: config.browserTimeoutMs });
  return { url: p.url(), title: await p.title() };
}

export async function goForward(): Promise<{ url: string; title: string }> {
  const p = await getPage();
  await p.goForward({ waitUntil: "domcontentloaded", timeout: config.browserTimeoutMs });
  return { url: p.url(), title: await p.title() };
}

export async function closeBrowser(): Promise<void> {
  const jobId = getAutomationJobId();
  await stopJobRecording();
  if (page && !page.isClosed()) {
    await page.close().catch(() => undefined);
  }
  page = null;
  if (browser) {
    await browser.close().catch(() => undefined);
    browser = null;
    clearBrowserState();
    if (jobId) releaseBrowserLock(jobId);
    else clearBrowserLock();
    return;
  }
  await closeBrowserFromStateFile();
  if (jobId) releaseBrowserLock(jobId);
  else clearBrowserLock();
}

/** Capture PNG base64 from the live browser via saved WebSocket endpoint (Cursor SDK path). */
export async function captureScreenshotFromStateFile(): Promise<string | undefined> {
  let state: BrowserState;
  try {
    state = JSON.parse(readFileSync(BROWSER_STATE_FILE, "utf8")) as BrowserState;
  } catch {
    return undefined;
  }

  if (!state.wsEndpoint) return undefined;

  try {
    const remote = await puppeteer.connect({ browserWSEndpoint: state.wsEndpoint });
    try {
      const pages = await remote.pages();
      const active = pages.find((p) => !p.isClosed()) ?? pages[0];
      if (!active || active.isClosed()) return undefined;

      const buffer = (await active.screenshot({
        fullPage: false,
        type: "png",
        encoding: "binary",
      })) as Buffer;
      return buffer.toString("base64");
    } finally {
      remote.disconnect();
    }
  } catch {
    return undefined;
  }
}

/** Close browser from another process via saved WebSocket endpoint (Cursor SDK path). */
export async function closeBrowserFromStateFile(): Promise<boolean> {
  let state: BrowserState;
  try {
    state = JSON.parse(readFileSync(BROWSER_STATE_FILE, "utf8")) as BrowserState;
  } catch {
    return false;
  }

  if (!state.wsEndpoint) return false;

  try {
    const remote = await puppeteer.connect({ browserWSEndpoint: state.wsEndpoint });
    await remote.close();
    clearBrowserState();
    if (browser?.connected) {
      browser = null;
      page = null;
    }
    clearBrowserLock();
    return true;
  } catch {
    clearBrowserState();
    clearBrowserLock();
    return false;
  }
}

export function assertPageOpen(): void {
  if (!page || page.isClosed()) {
    throw new ToolError("No browser page open. Call browser_navigate first.");
  }
}
