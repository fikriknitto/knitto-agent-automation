import { existsSync } from "node:fs";
import { mkdir, stat } from "node:fs/promises";
import { dirname, join } from "node:path";
import { platform as osPlatform } from "node:os";
import type { Page } from "puppeteer";
import { PuppeteerScreenRecorder } from "puppeteer-screen-recorder";
import { createLogger } from "../../mcp-kit/core/index.js";
import {
  getAutomationJobId,
  resolveAgentScreenshotDir,
  resolveAgentScreenshotDirForJob,
} from "../job-context.js";
import {
  getPendingSegment,
  isJobSegmentManaged,
  isSegmentStarted,
  markSegmentStarted,
} from "../../../core/evidence/segment-context.js";
import { setActiveSegment, clearActiveSegment } from "../../../core/evidence/segment-state-file.js";
import config from "../config.js";

const logger = createLogger("browser-recording");

const MIN_VIDEO_BYTES = 10_240;

let activeRecorder: PuppeteerScreenRecorder | null = null;
let activeOutputPath: string | null = null;
let stopPromise: Promise<string | undefined> | null = null;
let segmentMode = false;
let headlessWarningLogged = false;

function logHeadlessBlackScreenRisk(): void {
  if (headlessWarningLogged || !config.headless) return;
  if (osPlatform() === "win32") {
    logger.warn(
      "AUTOMATION_HEADLESS=true on Windows — puppeteer-screen-recorder may produce black video frames; set AUTOMATION_HEADLESS=false for visible recordings"
    );
  }
  headlessWarningLogged = true;
}

function logFfmpegPathWarning(): void {
  if (config.ffmpegPath) return;
  logger.warn(
    "AUTOMATION_FFMPEG_PATH not set — browser video encoding may fail or produce corrupt files"
  );
}

export function resolveAgentVideoPath(jobId?: string, filename?: string): string {
  const name = filename ?? config.videoFilename;
  const dir = jobId
    ? resolveAgentScreenshotDirForJob(jobId)
    : resolveAgentScreenshotDir();
  return join(dir, name);
}

export function isJobRecording(): boolean {
  return activeRecorder !== null;
}

export function isSegmentMode(): boolean {
  return segmentMode;
}

async function waitForVideoFile(
  filePath: string,
  timeoutMs = 8000,
  intervalMs = 150
): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  let lastSize = -1;

  while (Date.now() < deadline) {
    try {
      const stats = await stat(filePath);
      if (stats.size > 0) {
        if (stats.size === lastSize) return true;
        lastSize = stats.size;
      }
    } catch {
      // file belum dibuat ffmpeg
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  return existsSync(filePath);
}

/** Poll until ffmpeg finishes writing recording.mp4 (stable non-zero size). */
export async function waitForJobVideoReady(
  jobId: string,
  timeoutMs = 8000
): Promise<void> {
  if (!config.recordVideo) return;
  const path = resolveAgentVideoPath(jobId);
  await waitForVideoFile(path, timeoutMs);
}

export async function ensureBrowserSegmentRecording(
  page: Page,
  jobId: string
): Promise<boolean> {
  const pending = getPendingSegment(jobId);
  if (!pending || pending.platform !== "browser") return false;
  if (isSegmentStarted(jobId, pending.testCaseId) || activeRecorder) return true;

  const pageUrl = page.url();
  if (pageUrl === "about:blank" || !pageUrl.trim()) {
    return false;
  }

  await startBrowserSegment(page, jobId, pending.filename);
  if (activeRecorder) {
    markSegmentStarted(jobId, pending.testCaseId);
    return true;
  }
  return false;
}

export async function startJobRecording(page: Page): Promise<void> {
  if (!config.recordVideo || activeRecorder || segmentMode) return;

  const jobId = getAutomationJobId();
  if (!jobId) return;

  if (isJobSegmentManaged(jobId) && getPendingSegment(jobId)) {
    return;
  }

  logHeadlessBlackScreenRisk();
  logFfmpegPathWarning();

  const savePath = resolveAgentVideoPath(jobId);

  try {
    await mkdir(dirname(savePath), { recursive: true });

    const recorder = new PuppeteerScreenRecorder(page, {
      followNewTab: true,
      fps: config.recordFps,
      ffmpeg_Path: config.ffmpegPath ?? null,
      videoFrame: {
        width: config.viewportWidth,
        height: config.viewportHeight,
      },
      videoCodec: "libx264",
      videoPreset: "ultrafast",
    });

    await recorder.start(savePath);
    activeRecorder = recorder;
    activeOutputPath = savePath;

    const finalizeOnBrowserEnd = () => {
      void stopJobRecording();
    };
    page.once("close", finalizeOnBrowserEnd);
    page.browser().once("disconnected", finalizeOnBrowserEnd);

    logger.info(`Recording started: ${savePath}`);
  } catch (error) {
    logger.warn(
      `Recording failed to start: ${error instanceof Error ? error.message : String(error)}`
    );
    activeRecorder = null;
    activeOutputPath = null;
  }
}

async function finalizeStop(): Promise<string | undefined> {
  if (!activeRecorder) {
    return activeOutputPath && existsSync(activeOutputPath) ? activeOutputPath : undefined;
  }

  const outputPath = activeOutputPath;
  const recorder = activeRecorder;
  activeRecorder = null;
  activeOutputPath = null;

  const jobId = getAutomationJobId();
  try {
    await recorder.stop();
    if (outputPath) {
      const ready = await waitForVideoFile(outputPath);
      if (ready) {
        try {
          const fileStats = await stat(outputPath);
          logger.info(`Recording saved: ${outputPath} (${fileStats.size} bytes)`);
          if (fileStats.size < MIN_VIDEO_BYTES) {
            logger.warn(
              `Recording file suspiciously small (${fileStats.size} bytes) — video may be empty or black: ${outputPath}`
            );
          }
        } catch {
          logger.info(`Recording saved: ${outputPath}`);
        }
        if (jobId) clearActiveSegment(jobId);
        return outputPath;
      }
    }
  } catch (error) {
    logger.warn(
      `Recording stop failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  return outputPath && existsSync(outputPath) ? outputPath : undefined;
}

export async function stopJobRecording(): Promise<string | undefined> {
  if (stopPromise) return stopPromise;

  stopPromise = finalizeStop().finally(() => {
    stopPromise = null;
    segmentMode = false;
  });

  return stopPromise;
}

export async function startBrowserSegment(
  page: Page,
  jobId: string,
  filename: string
): Promise<void> {
  if (!config.recordVideo) return;
  if (activeRecorder) {
    await stopBrowserSegment();
  }

  logHeadlessBlackScreenRisk();
  logFfmpegPathWarning();

  segmentMode = true;
  const savePath = resolveAgentVideoPath(jobId, filename);

  try {
    await mkdir(dirname(savePath), { recursive: true });

    const recorder = new PuppeteerScreenRecorder(page, {
      followNewTab: true,
      fps: config.recordFps,
      ffmpeg_Path: config.ffmpegPath ?? null,
      videoFrame: {
        width: config.viewportWidth,
        height: config.viewportHeight,
      },
      videoCodec: "libx264",
      videoPreset: "ultrafast",
    });

    await recorder.start(savePath);
    activeRecorder = recorder;
    activeOutputPath = savePath;
    const pending = getPendingSegment(jobId);
    if (pending) {
      setActiveSegment(jobId, {
        testCaseId: pending.testCaseId,
        filename: pending.filename,
        outputPath: savePath,
        platform: "browser",
        startedAt: new Date().toISOString(),
      });
    }
    logger.info(`Segment recording started: ${savePath}`);
  } catch (error) {
    segmentMode = false;
    logger.warn(
      `Segment recording failed to start: ${error instanceof Error ? error.message : String(error)}`
    );
    activeRecorder = null;
    activeOutputPath = null;
  }
}

export async function stopBrowserSegment(): Promise<string | undefined> {
  return stopJobRecording();
}
