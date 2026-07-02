import type { MobileConfig } from "@knitto/shared";

export function buildAndroidCapabilities(opts: {
  udid: string;
  mobileConfig: MobileConfig;
  appActivity?: string;
}): Record<string, unknown> {
  const activity = opts.appActivity ?? opts.mobileConfig.appActivity;
  const caps: Record<string, unknown> = {
    platformName: "Android",
    "appium:automationName": "UiAutomator2",
    "appium:udid": opts.udid,
    "appium:appPackage": opts.mobileConfig.appPackage,
    "appium:noReset": true,
    "appium:autoGrantPermissions": true,
    "appium:newCommandTimeout": 300,
  };
  if (activity) {
    caps["appium:appActivity"] = activity;
  }
  return caps;
}
