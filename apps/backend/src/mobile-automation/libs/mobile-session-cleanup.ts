import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { createLogger } from "../../automation/core/index.js";
import mobileConfig from "./config.js";
import { devicePool } from "./driver/device-pool.js";
import { clearMobileJobContext } from "./mobile-job-context.js";
import {
  clearMobileSessionState,
  readMobileSessionState,
} from "./mobile-session-state.js";

const logger = createLogger("mobile-session-cleanup");
const execFileAsync = promisify(execFile);

function appiumSessionDeleteUrl(sessionId: string): string {
  const parsed = new URL(mobileConfig.appiumServerUrl);
  const basePath = parsed.pathname.replace(/\/$/, "") || "";
  return `${parsed.protocol}//${parsed.host}${basePath}/session/${encodeURIComponent(sessionId)}`;
}

export async function terminateAppViaAdb(udid: string, appPackage: string): Promise<void> {
  const args = udid
    ? ["-s", udid, "shell", "am", "force-stop", appPackage]
    : ["shell", "am", "force-stop", appPackage];
  await execFileAsync("adb", args, { timeout: 15_000 });
}

export async function deleteAppiumSession(sessionId: string): Promise<boolean> {
  try {
    const res = await fetch(appiumSessionDeleteUrl(sessionId), { method: "DELETE" });
    return res.ok || res.status === 404;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.warn(`Appium DELETE session failed: ${msg}`);
    return false;
  }
}

/** Force-stop app via adb using persisted session state (no in-process driver). */
export async function terminateMobileAppFromState(jobId: string): Promise<boolean> {
  const state = readMobileSessionState(jobId);
  if (!state) return false;

  try {
    await terminateAppViaAdb(state.udid, state.appPackage);
    logger.info(`Mobile app terminated via state: ${state.appPackage} job=${jobId}`);
    return true;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.warn(`adb force-stop from state failed for job=${jobId}: ${msg}`);
    return false;
  }
}

/** Close Appium session + release device via persisted session state. */
export async function closeMobileSessionFromState(jobId: string): Promise<boolean> {
  const state = readMobileSessionState(jobId);
  if (!state) {
    devicePool.release(jobId);
    clearMobileJobContext(jobId);
    return false;
  }

  const deleted = await deleteAppiumSession(state.sessionId);
  if (deleted) {
    logger.info(`Appium session deleted from state: job=${jobId}`);
  }

  devicePool.release(jobId);
  clearMobileJobContext(jobId);
  clearMobileSessionState(jobId);
  return true;
}
