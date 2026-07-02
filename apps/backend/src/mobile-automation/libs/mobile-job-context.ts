import type { MobileConfig } from "@knitto/shared";

const configByJob = new Map<string, MobileConfig>();
const udidByJob = new Map<string, string>();

function mobileConfigFromEnv(): MobileConfig | undefined {
  const appPackage = process.env.MOBILE_JOB_APP_PACKAGE?.trim();
  if (!appPackage) return undefined;
  return {
    appPackage,
    appActivity: process.env.MOBILE_JOB_APP_ACTIVITY?.trim() || undefined,
    udid: process.env.MOBILE_JOB_UDID?.trim() || undefined,
    deepLink: process.env.MOBILE_JOB_DEEP_LINK?.trim() || undefined,
  };
}

export function setMobileJobConfig(jobId: string, config: MobileConfig | undefined): void {
  const id = jobId.trim();
  if (!id) return;
  if (!config?.appPackage?.trim()) {
    configByJob.delete(id);
    return;
  }
  configByJob.set(id, {
    appPackage: config.appPackage.trim(),
    appActivity: config.appActivity?.trim() || undefined,
    udid: config.udid?.trim() || undefined,
    deepLink: config.deepLink?.trim() || undefined,
  });
}

export function getMobileJobConfig(jobId: string): MobileConfig | undefined {
  const fromMap = configByJob.get(jobId.trim());
  if (fromMap) return fromMap;
  const envJobId = process.env.MOBILE_JOB_ID?.trim() ?? process.env.AUTOMATION_JOB_ID?.trim();
  if (envJobId === jobId.trim()) {
    return mobileConfigFromEnv();
  }
  return undefined;
}

export function setMobileJobUdid(jobId: string, udid: string): void {
  udidByJob.set(jobId.trim(), udid);
}

export function getMobileJobUdid(jobId: string): string | undefined {
  return udidByJob.get(jobId.trim());
}

export function clearMobileJobContext(jobId: string): void {
  const id = jobId.trim();
  configByJob.delete(id);
  udidByJob.delete(id);
}
