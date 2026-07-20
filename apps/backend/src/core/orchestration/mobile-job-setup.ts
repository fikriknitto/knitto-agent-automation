import type { MobileConfig } from "@knitto/shared";
import { createLogger } from "../logging.js";
import { setAutomationJobId } from "../../platforms/browser/job-context.js";
import mobileConfig from "../../mobile-automation/libs/config.js";
import { devicePool } from "../../mobile-automation/libs/driver/device-pool.js";
import {
  closeApp,
  closeSession,
  createSession,
  hasActiveSession,
} from "../../mobile-automation/libs/driver/session.js";
import { setMobileJobConfig } from "../../mobile-automation/libs/mobile-job-context.js";

const logger = createLogger("mobile-job-setup");

/** Buat sesi Appium + startRecordingScreen sedini mungkin (awal job). */
export async function prepareMobileJobSession(
  jobId: string,
  config: MobileConfig | undefined
): Promise<void> {
  if (!config?.appPackage?.trim() || !mobileConfig.recordVideo) return;
  if (hasActiveSession(jobId)) return;

  setAutomationJobId(jobId);
  setMobileJobConfig(jobId, config);

  try {
    await createSession();
    logger.info(`Mobile session prepared for recording: job=${jobId}`);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.warn(`prepareMobileJobSession failed (will retry on launch_app): ${msg}`);
  }
}

export async function cleanupMobileJob(jobId: string): Promise<void> {
  setAutomationJobId(jobId);

  if (hasActiveSession(jobId)) {
    try {
      await closeApp();
      await closeSession();
    } catch {
      // best-effort — stopRecordingScreen + deleteSession + release device
    }
    return;
  }

  devicePool.release(jobId);
}
