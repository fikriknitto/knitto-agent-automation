import { resolveMainActivity } from "./adb/adb-client.js";
import { getMobileJobConfig } from "./mobile-job-context.js";

export async function ensureAppActivity(
  jobId: string,
  udid: string,
  appPackage: string
): Promise<string> {
  const config = getMobileJobConfig(jobId);
  if (config?.appActivity) return config.appActivity;
  const activity = await resolveMainActivity(udid, appPackage);
  if (config) {
    config.appActivity = activity;
  }
  return activity;
}
