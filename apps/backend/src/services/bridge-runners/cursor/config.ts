import { mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { resolveAutomationMcpPath } from "../../shared/automation-mcp-config.js";

function resolveBridgeCwd(): string {
  if (process.env.KNITTO_BRIDGE_CWD) return process.env.KNITTO_BRIDGE_CWD;
  const dir = join(tmpdir(), "knitto-automation-bridge-cursor");
  mkdirSync(dir, { recursive: true });
  return dir;
}

let cursorApiKey = process.env.CURSOR_API_KEY ?? "";

export function setCursorApiKey(key: string): void {
  cursorApiKey = key;
}

export default {
  get cursorApiKey() {
    return cursorApiKey;
  },
  automationMcpPath: resolveAutomationMcpPath(),
  get automationMcpCommand() {
    return process.env.AUTOMATION_MCP_COMMAND?.trim() || "pnpm";
  },
  bridgeCwd: resolveBridgeCwd(),
  maxConcurrentPerChannel: Number(process.env.KNITTO_BRIDGE_MAX_CONCURRENT ?? "1"),
  jobTimeoutMs: Number(process.env.KNITTO_BRIDGE_JOB_TIMEOUT_MS ?? "600000"),
  modelId: process.env.KNITTO_BRIDGE_MODEL ?? "composer-2.5",
};
