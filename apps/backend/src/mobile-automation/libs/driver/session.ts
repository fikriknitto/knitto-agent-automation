import { remote, type Browser } from "webdriverio";
import { ToolError } from "../../../automation/core/index.js";
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

  const appium = parseAppiumUrl(mobileConfig.appiumServerUrl);
  try {
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
    devicePool.release(jobId);
    const msg = error instanceof Error ? error.message : String(error);
    throw new ToolError(
      `Appium tidak reachable di ${mobileConfig.appiumServerUrl}: ${msg}`
    );
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

  const driver = await getDriver();
  const udid = getMobileJobUdid(jobId) ?? mobileCfg.udid ?? "";

  if (mobileCfg.deepLink) {
    await driver.execute("mobile: deepLink", {
      url: mobileCfg.deepLink,
      package: mobileCfg.appPackage,
    });
  } else {
    await driver.activateApp(mobileCfg.appPackage);
  }

  let activity: string | undefined = mobileCfg.appActivity;
  try {
    activity = (await driver.getCurrentActivity()) ?? activity;
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
