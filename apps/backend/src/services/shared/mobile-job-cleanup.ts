import { setAutomationJobId } from "../../automation/libs/job-context.js";
import { closeApp, closeSession } from "../../mobile-automation/libs/driver/session.js";

export async function cleanupMobileJob(jobId: string): Promise<void> {
  setAutomationJobId(jobId);
  try {
    await closeApp();
  } catch {
    // best-effort — Appium terminateApp
  }
  try {
    await closeSession();
  } catch {
    // best-effort — deleteSession + release device
  }
}
