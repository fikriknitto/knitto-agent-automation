import { remote, type Browser } from "webdriverio";
import { ToolError } from "../../../automation/core/index.js";
import mobileConfig from "../config.js";
import { getAutomationJobId } from "../job-context.js";
import {
  clearMobileJobContext,
  getMobileJobConfig,
  getMobileJobUdid,
  setMobileJobUdid,
} from "../mobile-job-context.js";
import { buildAndroidCapabilities } from "./capabilities.js";
import { devicePool } from "./device-pool.js";

const sessions = new Map<string, Browser>();

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
    sessions.set(jobId, driver);
    return driver;
  } catch (error) {
    devicePool.release(jobId);
    const msg = error instanceof Error ? error.message : String(error);
    throw new ToolError(
      `Appium tidak reachable di ${mobileConfig.appiumServerUrl}: ${msg}`
    );
  }
}

export async function getDriver(): Promise<Browser> {
  const jobId = getAutomationJobId();
  if (jobId && sessions.has(jobId)) {
    return sessions.get(jobId)!;
  }
  return createSession();
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

  return {
    package: mobileCfg.appPackage,
    activity,
    udid,
  };
}

export async function closeSession(): Promise<{ closed: boolean }> {
  const jobId = getAutomationJobId();
  if (!jobId) return { closed: false };

  const driver = sessions.get(jobId);
  if (driver) {
    try {
      await driver.deleteSession();
    } catch {
      // ignore
    }
    sessions.delete(jobId);
  }

  devicePool.release(jobId);
  clearMobileJobContext(jobId);
  return { closed: true };
}
