import { mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { resolveAutomationMcpPath, resolveMobileMcpPath } from "../../shared/automation-mcp-config.js";

function resolveBridgeCwd(): string {
  if (process.env.KNITTO_BRIDGE_CWD) return process.env.KNITTO_BRIDGE_CWD;
  const dir = join(tmpdir(), "knitto-automation-bridge-cursor");
  mkdirSync(dir, { recursive: true });
  return dir;
}

/** In-memory only — set from Web UI via WebSocket credentials (no env fallback). */
let cursorApiKey = "";

export function setCursorApiKey(key: string): void {
  cursorApiKey = key;
}

export default {
  get cursorApiKey() {
    return cursorApiKey;
  },
  automationMcpPath: resolveAutomationMcpPath(),
  mobileMcpPath: resolveMobileMcpPath(),
  get automationMcpCommand() {
    return process.env.AUTOMATION_MCP_COMMAND?.trim() || "pnpm";
  },
  bridgeCwd: resolveBridgeCwd(),
  maxConcurrentPerChannel: Number(process.env.KNITTO_BRIDGE_MAX_CONCURRENT ?? "1"),
  jobTimeoutMs: Number(process.env.KNITTO_BRIDGE_JOB_TIMEOUT_MS ?? "600000"),
  modelId: process.env.KNITTO_BRIDGE_MODEL ?? "composer-2.5",
};
