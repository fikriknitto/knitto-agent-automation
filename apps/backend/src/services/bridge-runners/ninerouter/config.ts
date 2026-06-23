import { mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { resolveAutomationMcpPath } from "../../shared/automation-mcp-config.js";

export interface NinerouterCredentials {
  baseUrl: string;
  apiKey: string;
}

function resolveBridgeCwd(): string {
  if (process.env.KNITTO_BRIDGE_CWD) return process.env.KNITTO_BRIDGE_CWD;
  const dir = join(tmpdir(), "knitto-automation-bridge-ninerouter");
  mkdirSync(dir, { recursive: true });
  return dir;
}

function resolveWsUrl(): string {
  const host = process.env.AUTOMATION_WS_SERVER ?? "localhost";
  const port = process.env.AUTOMATION_WS_PORT ?? "3077";
  const useTls =
    process.env.AUTOMATION_WS_TLS === "1" ||
    process.env.AUTOMATION_WS_TLS === "true" ||
    process.env.AUTOMATION_WS_USE_TLS === "1";
  const scheme = useTls ? "wss" : "ws";
  return `${scheme}://${host}:${port}`;
}

let ninerouterCredentials: NinerouterCredentials = {
  baseUrl: process.env.NINEROUTER_BASE_URL ?? "http://localhost:20128",
  apiKey: process.env.NINEROUTER_API_KEY ?? "",
};

export function setNinerouterCredentials(creds: NinerouterCredentials): void {
  ninerouterCredentials = creds;
}

export function normalizeNineRouterBaseUrl(url: string): string {
  let trimmed = url.trim().replace(/\/+$/, "");
  if (trimmed.endsWith("/v1")) trimmed = trimmed.slice(0, -3);
  return trimmed;
}

export function nineRouterApiV1(baseUrl: string): string {
  return `${normalizeNineRouterBaseUrl(baseUrl)}/v1`;
}

export default {
  get ninerouterCredentials() {
    return ninerouterCredentials;
  },
  automationMcpPath: resolveAutomationMcpPath(),
  automationMcpCommand: "pnpm",
  wsHost: process.env.AUTOMATION_WS_SERVER ?? "localhost",
  wsPort: Number(process.env.AUTOMATION_WS_PORT ?? "3077"),
  wsUrl: resolveWsUrl(),
  bridgeCwd: resolveBridgeCwd(),
  maxConcurrentPerChannel: Number(process.env.KNITTO_BRIDGE_MAX_CONCURRENT ?? "1"),
  jobTimeoutMs: Number(process.env.KNITTO_BRIDGE_JOB_TIMEOUT_MS ?? "600000"),
  modelId: process.env.NINEROUTER_MODEL ?? process.env.KNITTO_BRIDGE_MODEL ?? "",
  maxToolCalls: Number(process.env.KNITTO_BRIDGE_MAX_TOOL_CALLS ?? "40"),
  maxRetries: Number(process.env.NINEROUTER_MAX_RETRIES ?? "5"),
  retryDelayMs: Number(process.env.NINEROUTER_RETRY_DELAY_MS ?? "2000"),
};
