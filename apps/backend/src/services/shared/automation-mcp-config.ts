import { resolve } from "node:path";
import { resolveMemoryDir, resolveMonorepoRoot, resolveMcpStdioEntry, resolveScreenshotDir } from "../../config/paths.js";

export function resolveAutomationMcpPath(): string {
  return resolveMcpStdioEntry();
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
    AUTOMATION_UPLOAD_DIR: process.env.AUTOMATION_UPLOAD_DIR?.trim()
      ? resolve(root, process.env.AUTOMATION_UPLOAD_DIR.trim())
      : "",
    AUTOMATION_UPLOAD_MAX_BYTES: process.env.AUTOMATION_UPLOAD_MAX_BYTES ?? "",
    AUTOMATION_UPLOAD_CLEANUP: process.env.AUTOMATION_UPLOAD_CLEANUP ?? "",
  };
  if (jobId?.trim()) {
    env.AUTOMATION_JOB_ID = jobId.trim();
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
}): Record<string, { command: string; args: string[]; env: Record<string, string>; cwd?: string }> {
  const env = automationMcpEnv();
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
