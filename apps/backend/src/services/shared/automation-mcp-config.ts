import { resolve } from "node:path";
import type { AutomationPlatform, BridgeJob } from "@knitto/shared";
import {
  resolveMemoryDir,
  resolveMobileMemoryDir,
  resolveMobileMcpStdioEntry,
  resolveMonorepoRoot,
  resolveMcpStdioEntry,
  resolveScreenshotDir,
} from "../../config/paths.js";

export function resolveAutomationMcpPath(): string {
  return resolveMcpStdioEntry();
}

export function resolveMobileMcpPath(): string {
  return resolveMobileMcpStdioEntry();
}

export function automationMcpEnv(jobId?: string): Record<string, string> {
  const root = resolveMonorepoRoot();
  const env: Record<string, string> = {
    AUTOMATION_HEADLESS: process.env.AUTOMATION_HEADLESS ?? "false",
    AUTOMATION_SLOW_MO_MS: process.env.AUTOMATION_SLOW_MO_MS ?? "",
    AUTOMATION_MEMORY_DIR: resolveMemoryDir(root),
    AUTOMATION_SCREENSHOT_DIR: resolveScreenshotDir(root),
    AUTOMATION_BROWSER_TIMEOUT_MS: process.env.AUTOMATION_BROWSER_TIMEOUT_MS ?? "",
    AUTOMATION_VIEWPORT_WIDTH: process.env.AUTOMATION_VIEWPORT_WIDTH ?? "",
    AUTOMATION_VIEWPORT_HEIGHT: process.env.AUTOMATION_VIEWPORT_HEIGHT ?? "",
    AUTOMATION_RECORD_VIDEO: process.env.AUTOMATION_RECORD_VIDEO ?? "",
    AUTOMATION_RECORD_FPS: process.env.AUTOMATION_RECORD_FPS ?? "",
    AUTOMATION_FFMPEG_PATH: process.env.AUTOMATION_FFMPEG_PATH ?? "",
    AUTOMATION_VIDEO_FILENAME: process.env.AUTOMATION_VIDEO_FILENAME ?? "",
    AUTOMATION_UPLOAD_DIR: process.env.AUTOMATION_UPLOAD_DIR?.trim()
      ? resolve(root, process.env.AUTOMATION_UPLOAD_DIR.trim())
      : "",
    AUTOMATION_UPLOAD_MAX_BYTES: process.env.AUTOMATION_UPLOAD_MAX_BYTES ?? "",
  };
  if (jobId?.trim()) {
    env.AUTOMATION_JOB_ID = jobId.trim();
  }
  return env;
}

export function mobileMcpEnv(
  jobId?: string,
  mobileConfig?: {
    appPackage?: string;
    appActivity?: string;
    udid?: string;
    deepLink?: string;
  }
): Record<string, string> {
  const root = resolveMonorepoRoot();
  const env: Record<string, string> = {
    APPIUM_SERVER_URL: process.env.APPIUM_SERVER_URL ?? "http://127.0.0.1:4723",
    MOBILE_MEMORY_DIR: resolveMobileMemoryDir(root),
    AUTOMATION_SCREENSHOT_DIR: resolveScreenshotDir(root),
    MOBILE_IMPLICIT_WAIT_MS: process.env.MOBILE_IMPLICIT_WAIT_MS ?? "",
    MOBILE_SNAPSHOT_MAX_ELEMENTS: process.env.MOBILE_SNAPSHOT_MAX_ELEMENTS ?? "",
    MOBILE_UPLOAD_DIR: process.env.MOBILE_UPLOAD_DIR?.trim()
      ? resolve(root, process.env.MOBILE_UPLOAD_DIR.trim())
      : "",
    MOBILE_UPLOAD_MAX_BYTES: process.env.MOBILE_UPLOAD_MAX_BYTES ?? "",
    MOBILE_DEVICE_POOL_ENABLED: process.env.MOBILE_DEVICE_POOL_ENABLED ?? "",
    MOBILE_DEVICE_ACQUIRE_TIMEOUT_MS: process.env.MOBILE_DEVICE_ACQUIRE_TIMEOUT_MS ?? "",
    MOBILE_UDID: process.env.MOBILE_UDID ?? "",
    MOBILE_DEVICE_UDIDS: process.env.MOBILE_DEVICE_UDIDS ?? "",
  };
  if (jobId?.trim()) {
    env.AUTOMATION_JOB_ID = jobId.trim();
    env.MOBILE_JOB_ID = jobId.trim();
  }
  if (mobileConfig?.appPackage?.trim()) {
    env.MOBILE_JOB_APP_PACKAGE = mobileConfig.appPackage.trim();
  }
  if (mobileConfig?.appActivity?.trim()) {
    env.MOBILE_JOB_APP_ACTIVITY = mobileConfig.appActivity.trim();
  }
  if (mobileConfig?.udid?.trim()) {
    env.MOBILE_JOB_UDID = mobileConfig.udid.trim();
  }
  if (mobileConfig?.deepLink?.trim()) {
    env.MOBILE_JOB_DEEP_LINK = mobileConfig.deepLink.trim();
  }
  return env;
}

export function automationMcpSpawnArgs(opts: {
  command: string;
  mcpPath: string;
}): { command: string; args: string[] } {
  if (opts.command === "pnpm") {
    return { command: opts.command, args: ["exec", "tsx", opts.mcpPath] };
  }
  if (opts.command === "npx") {
    return { command: opts.command, args: ["tsx", opts.mcpPath] };
  }
  return { command: opts.command, args: [opts.mcpPath] };
}

export function cursorMcpServerConfig(opts: {
  command: string;
  args: string[];
  cwd: string;
  jobId?: string;
  platform?: AutomationPlatform;
  mobileConfig?: BridgeJob["mobileConfig"];
}): Record<string, { command: string; args: string[]; env: Record<string, string>; cwd?: string }> {
  const platform = opts.platform ?? "browser";
  if (platform === "mobile") {
    const env = mobileMcpEnv(opts.jobId, opts.mobileConfig);
    const filtered = Object.fromEntries(Object.entries(env).filter(([, v]) => v));
    return {
      mobile: {
        command: opts.command,
        args: opts.args,
        env: filtered,
        cwd: opts.cwd,
      },
    };
  }

  const env = automationMcpEnv(opts.jobId);
  const filtered = Object.fromEntries(Object.entries(env).filter(([, v]) => v));
  return {
    automation: {
      command: opts.command,
      args: opts.args,
      env: filtered,
      cwd: opts.cwd,
    },
  };
}

export function resolveMcpPathForJob(job: BridgeJob): string {
  return job.platform === "mobile" ? resolveMobileMcpPath() : resolveAutomationMcpPath();
}

export function resolveMcpServerKey(job: BridgeJob): "mobile" | "automation" {
  return job.platform === "mobile" ? "mobile" : "automation";
}
