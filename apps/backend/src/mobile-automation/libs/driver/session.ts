import { remote, type Browser } from "webdriverio";
import type { MobileConfig } from "@knitto/shared";
import { createLogger, ToolError } from "../../../automation/core/index.js";
import mobileConfig from "../config.js";
import { getAutomationJobId } from "../job-context.js";
import {
  clearMobileJobContext,
  getMobileJobConfig,
  getMobileJobUdid,
  setMobileJobConfig,
  setMobileJobUdid,
} from "../mobile-job-context.js";
import { buildAndroidCapabilities } from "./capabilities.js";
import { devicePool } from "./device-pool.js";
import {
  connect as adbConnect,
  disconnect as adbDisconnect,
  isDeviceOnline,
  killServer as adbKillServer,
  reconnectOffline,
  startServer as adbStartServer,
} from "../adb/adb-client.js";
import {
  startMobileJobRecording,
  stopMobileJobRecording,
  isSegmentRecordingManaged,
} from "../recording.js";
import { ensureSegmentRecordingStarted } from "../../../services/shared/segment-recording.js";
import { getPendingSegment, isJobSegmentManaged } from "../../../services/shared/segment-context.js";
import { writeMobileSessionState, clearMobileSessionState } from "../mobile-session-state.js";
import {
  closeMobileSessionFromState,
  terminateMobileAppBestEffort,
} from "../mobile-session-cleanup.js";

const logger = createLogger("mobile-session");

const sessions = new Map<string, Browser>();

export function hasActiveSession(jobId: string): boolean {
  return sessions.has(jobId);
}

function getActiveDriver(jobId: string): Browser | undefined {
  return sessions.get(jobId);
}

function parseAppiumUrl(url: string): {
  hostname: string;
  port: number;
  path: string;
  protocol: "http" | "https";
} {
  const parsed = new URL(url);
  return {
    hostname: parsed.hostname,
    port: Number(parsed.port || (parsed.protocol === "https:" ? 443 : 4723)),
    path: parsed.pathname && parsed.pathname !== "/" ? parsed.pathname : "/",
    protocol: parsed.protocol === "https:" ? "https" : "http",
  };
}

async function tryRecoverOfflineDevice(udid: string): Promise<void> {
  // Best-effort: restart adb server and reconnect target.
  // This is mainly for BlueStacks where ADB endpoints can flip to "offline".
  logger.warn(`Device ${udid} offline — attempting adb recovery (kill-server/start-server/reconnect)`);
  await adbKillServer();
  await adbStartServer();
  await reconnectOffline();

  // If udid is host:port (e.g. BlueStacks), reconnect explicitly.
  if (udid.includes(":")) {
    try {
      await adbDisconnect(udid);
    } catch {
      // ignore
    }
    try {
      await adbConnect(udid);
    } catch {
      // ignore
    }
  }
}

/** Opens the actual Appium session for a device the job already owns (or is acquiring for the first time). Does not touch the device pool. */
async function openAppiumSession(
  jobId: string,
  udid: string,
  mobileCfg: MobileConfig
): Promise<Browser> {
  const appium = parseAppiumUrl(mobileConfig.appiumServerUrl);
  try {
    if (!(await isDeviceOnline(udid))) {
      await tryRecoverOfflineDevice(udid);
      if (!(await isDeviceOnline(udid))) {
        throw new ToolError(
          `Device ${udid} offline. Jika pakai BlueStacks, jalankan: pnpm instances:up`
        );
      }
    }

    const driver = await remote({
      hostname: appium.hostname,
      port: appium.port,
      path: appium.path,
      protocol: appium.protocol,
      capabilities: buildAndroidCapabilities({ udid, mobileConfig: mobileCfg }),
      logLevel: "warn",
    });
    await driver.setTimeout({ implicit: mobileConfig.implicitWaitMs });
    if (!isSegmentRecordingManaged(jobId)) {
      await startMobileJobRecording(driver);
    }
    sessions.set(jobId, driver);
    writeMobileSessionState(jobId, {
      jobId,
      sessionId: driver.sessionId,
      udid,
      appPackage: mobileCfg.appPackage,
    });
    return driver;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    // WebdriverIO remote() can throw various errors; keep message but make "device offline"
    // actionable (it's not an Appium reachability issue).
    const offlineHint =
      /device offline/i.test(msg) || /Could not find online devices/i.test(msg)
        ? ` Device ${udid} terlihat offline (ADB). Coba: adb kill-server && adb start-server && pnpm instances:up`
        : "";
    throw new ToolError(`Gagal membuat session Appium (${mobileConfig.appiumServerUrl}): ${msg}.${offlineHint}`);
  }
}

export async function createSession(): Promise<Browser> {
  const jobId = getAutomationJobId();
  if (!jobId) {
    throw new ToolError("Job ID belum diset untuk sesi mobile.");
  }

  const existing = sessions.get(jobId);
  if (existing) return existing;

  const mobileCfg = getMobileJobConfig(jobId);
  if (!mobileCfg?.appPackage) {
    throw new ToolError("mobileConfig belum diset — pilih package di UI.");
  }

  const preferredUdid = mobileCfg.udid ?? process.env.MOBILE_JOB_UDID?.trim();
  const envJobId = process.env.MOBILE_JOB_ID?.trim() ?? process.env.AUTOMATION_JOB_ID?.trim();
  const skipPoolAcquire = Boolean(
    process.env.MOBILE_JOB_UDID?.trim() && envJobId === jobId
  );

  let udid: string;
  try {
    if (skipPoolAcquire && preferredUdid) {
      udid = preferredUdid;
      setMobileJobUdid(jobId, udid);
    } else {
      udid = await devicePool.acquire(jobId, preferredUdid);
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    throw new ToolError(msg);
  }

  setMobileJobUdid(jobId, udid);

  try {
    return await openAppiumSession(jobId, udid, mobileCfg);
  } catch (error) {
    devicePool.release(jobId);
    throw error;
  }
}

const INSTRUMENTATION_CRASH_PATTERNS = [
  /instrumentation process is not running/i,
  /cannot be proxied to uiautomator2 server/i,
  /uiautomator2 server .*(not running|not responding|has stopped|is not started)/i,
];

/** True for the "UiAutomator2 died mid-session" family of errors seen on BlueStacks (see memory/mobile logs) — not a device-offline or Appium-unreachable issue. */
export function isInstrumentationCrash(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  return INSTRUMENTATION_CRASH_PATTERNS.some((re) => re.test(msg));
}

/** Drops the broken Appium session and opens a fresh one on the same device, without releasing it back to the pool (the job still owns it). */
export async function recreateSessionAfterCrash(jobId: string): Promise<Browser> {
  logger.warn(`Recreating Appium session after instrumentation crash: job=${jobId}`);

  const broken = sessions.get(jobId);
  if (broken) {
    try {
      await broken.deleteSession();
    } catch {
      // Session is already dead server-side — nothing to clean up.
    }
    sessions.delete(jobId);
  }

  const mobileCfg = getMobileJobConfig(jobId);
  const udid = getMobileJobUdid(jobId);
  if (!mobileCfg?.appPackage || !udid) {
    throw new ToolError("Tidak bisa memulihkan sesi mobile: konteks job hilang.");
  }

  const driver = await openAppiumSession(jobId, udid, mobileCfg);
  logger.info(`Session recreated after crash: job=${jobId} udid=${udid}`);
  return driver;
}

/**
 * Runs `fn` against the current driver; if it fails with an instrumentation-crash
 * signature, recreates the Appium session once and retries `fn` against the fresh driver.
 * Use this for tool operations instead of calling getDriver() directly.
 */
export async function withInstrumentationRecovery<T>(
  fn: (driver: Browser) => Promise<T>
): Promise<T> {
  const driver = await getDriver();
  try {
    return await fn(driver);
  } catch (error) {
    const jobId = getAutomationJobId();
    if (!jobId || !isInstrumentationCrash(error)) throw error;
    const msg = error instanceof Error ? error.message : String(error);
    logger.warn(`Instrumentation crash detected, retrying once: job=${jobId} error=${msg}`);
    const recovered = await recreateSessionAfterCrash(jobId);
    return await fn(recovered);
  }
}

export async function openDriver(): Promise<Browser> {
  const jobId = getAutomationJobId();
  if (jobId && sessions.has(jobId)) {
    return sessions.get(jobId)!;
  }
  return createSession();
}

async function syncMobileContextForSegment(jobId: string): Promise<void> {
  const pending = getPendingSegment(jobId);
  if (pending?.mobileConfig?.appPackage) {
    setMobileJobConfig(jobId, pending.mobileConfig);
  }
}

async function ensureMobileSegmentIfManaged(jobId: string): Promise<void> {
  if (!isJobSegmentManaged(jobId)) return;
  await ensureSegmentRecordingStarted(jobId);
}

export async function getDriver(): Promise<Browser> {
  const jobId = getAutomationJobId();
  if (jobId) {
    await syncMobileContextForSegment(jobId);
  }
  const driver = await openDriver();
  if (jobId) {
    await ensureMobileSegmentIfManaged(jobId);
  }
  return driver;
}

export async function launchApp(): Promise<{
  package: string;
  activity?: string;
  udid: string;
}> {
  const jobId = getAutomationJobId();
  if (!jobId) throw new ToolError("Job ID belum diset.");

  const mobileCfg = getMobileJobConfig(jobId);
  if (!mobileCfg?.appPackage) {
    throw new ToolError("mobileConfig belum diset — pilih package di UI.");
  }

  const udid = getMobileJobUdid(jobId) ?? mobileCfg.udid ?? "";

  await withInstrumentationRecovery(async (driver) => {
    if (mobileCfg.deepLink) {
      await driver.execute("mobile: deepLink", {
        url: mobileCfg.deepLink,
        package: mobileCfg.appPackage,
      });
    } else {
      await driver.activateApp(mobileCfg.appPackage);
    }
  });

  let activity: string | undefined = mobileCfg.appActivity;
  try {
    activity = (await getActiveDriver(jobId)?.getCurrentActivity()) ?? activity;
  } catch {
    // ignore
  }

  await ensureSegmentRecordingStarted(jobId);

  return {
    package: mobileCfg.appPackage,
    activity,
    udid,
  };
}

export async function closeApp(): Promise<{
  package: string;
  closed: boolean;
  udid: string;
}> {
  const jobId = getAutomationJobId();
  if (!jobId) throw new ToolError("Job ID belum diset.");

  const mobileCfg = getMobileJobConfig(jobId);
  if (!mobileCfg?.appPackage) {
    throw new ToolError("mobileConfig belum diset — pilih package di UI.");
  }

  const driver = getActiveDriver(jobId);
  const udid = getMobileJobUdid(jobId) ?? mobileCfg.udid ?? "";
  const pkg = mobileCfg.appPackage;

  if (driver) {
    try {
      await driver.terminateApp(pkg);
    } catch (error) {
      // Appium session may already be gone; fall back to adb.
      const viaAdb = await terminateMobileAppBestEffort({ jobId, udid, appPackage: pkg });
      if (!viaAdb) {
        const msg = error instanceof Error ? error.message : String(error);
        throw new ToolError(`Failed to close app ${pkg}: ${msg}`);
      }
    }
    return { package: pkg, closed: true, udid };
  }

  // Cursor cleanup spawn: no in-memory driver (and state file may be gone after agent MCP exit).
  const closed = await terminateMobileAppBestEffort({
    jobId,
    udid,
    appPackage: pkg,
  });
  if (!closed) {
    throw new ToolError(
      `Gagal force-stop ${pkg} via adb — pastikan adb devices melihat device dan ANDROID_HOME/ADB tersedia.`
    );
  }
  return { package: pkg, closed: true, udid };
}

export async function closeSession(): Promise<{ closed: boolean }> {
  const jobId = getAutomationJobId();
  if (!jobId) return { closed: false };

  const driver = sessions.get(jobId);
  if (driver) {
    try {
      if (!isSegmentRecordingManaged(jobId)) {
        await stopMobileJobRecording(driver);
      }
      await driver.deleteSession();
    } catch {
      // ignore
    }
    sessions.delete(jobId);
    clearMobileSessionState(jobId);
  } else {
    await closeMobileSessionFromState(jobId);
    return { closed: true };
  }

  devicePool.release(jobId);
  clearMobileJobContext(jobId);
  return { closed: true };
}
