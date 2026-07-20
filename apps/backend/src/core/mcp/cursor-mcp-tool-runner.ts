import type { MobileConfig } from "@knitto/shared";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { createLogger } from "../logging.js";
import { setAutomationJobId } from "../../platforms/browser/job-context.js";
import { resolveMonorepoRoot } from "../../config/paths.js";
import config from "../../agents/cursor/config.js";
import {
  automationMcpEnv,
  automationMcpSpawnArgs,
  mobileMcpEnv,
  resolveAutomationMcpPath,
  resolveMobileMcpPath,
} from "./automation-mcp-config.js";

const logger = createLogger("cursor-mcp-tool-runner");

export type CursorMcpServerKind = "browser" | "mobile";

export type CursorMcpToolResult = {
  stopped?: boolean;
  path?: string;
  warning?: string;
};

async function connectStdioMcp(args: {
  jobId: string;
  server: CursorMcpServerKind;
  mobileConfig?: MobileConfig;
  segmentManaged?: boolean;
  forceClose?: boolean;
}): Promise<Client> {
  const mcpCommand = config.automationMcpCommand;
  const cwd = resolveMonorepoRoot();
  const segmentManaged = args.segmentManaged ?? true;

  let command: string;
  let spawnArgs: string[];
  let env: Record<string, string>;

  if (args.server === "mobile") {
    const mobilePath = resolveMobileMcpPath();
    const spawn = automationMcpSpawnArgs({ command: mcpCommand, mcpPath: mobilePath });
    command = spawn.command;
    spawnArgs = spawn.args;
    env = Object.fromEntries(
      Object.entries(mobileMcpEnv(args.jobId, args.mobileConfig, { segmentManaged })).filter(
        ([, v]) => v
      )
    );
  } else {
    const browserPath = resolveAutomationMcpPath();
    const spawn = automationMcpSpawnArgs({ command: mcpCommand, mcpPath: browserPath });
    command = spawn.command;
    spawnArgs = spawn.args;
    env = Object.fromEntries(
      Object.entries(automationMcpEnv(args.jobId, { segmentManaged })).filter(([, v]) => v)
    );
  }

  if (args.forceClose) {
    env.AUTOMATION_FORCE_CLOSE = "1";
    env.MOBILE_FORCE_CLOSE = "1";
  }

  const mergedEnv = { ...process.env, ...env } as Record<string, string>;
  if (!segmentManaged) {
    if (args.forceClose) {
      // End-of-job cleanup: keep MULTI_TC so mobile MCP does NOT early-createSession
      // (that would relaunch the app). FORCE_CLOSE still bypasses the close guard.
      mergedEnv.AUTOMATION_MULTI_TC = "1";
      mergedEnv.MOBILE_MULTI_TC = "1";
    } else {
      // Non-cleanup spawn with segmentManaged off — do not inherit parent MULTI_TC.
      delete mergedEnv.AUTOMATION_MULTI_TC;
      delete mergedEnv.MOBILE_MULTI_TC;
    }
  }

  const transport = new StdioClientTransport({
    command,
    args: spawnArgs,
    env: mergedEnv,
    cwd,
    stderr: "pipe",
  });

  const client = new Client({ name: "knitto-cursor-cleanup", version: "1.0.0" });
  await client.connect(transport);
  return client;
}

function parseToolResult(result: Awaited<ReturnType<Client["callTool"]>>): CursorMcpToolResult {
  const structured = result.structuredContent;
  if (structured && typeof structured === "object") {
    const obj = structured as Record<string, unknown>;
    return {
      stopped: typeof obj.stopped === "boolean" ? obj.stopped : undefined,
      path: typeof obj.path === "string" ? obj.path : undefined,
      warning: typeof obj.warning === "string" ? obj.warning : undefined,
    };
  }

  const content = Array.isArray(result.content) ? result.content : [];
  const text = content.find((part): part is { type: "text"; text: string } =>
    typeof part === "object" && part !== null && "type" in part && part.type === "text"
  )?.text;
  if (text) {
    try {
      const parsed = JSON.parse(text) as Record<string, unknown>;
      return {
        stopped: typeof parsed.stopped === "boolean" ? parsed.stopped : undefined,
        path: typeof parsed.path === "string" ? parsed.path : undefined,
        warning: typeof parsed.warning === "string" ? parsed.warning : undefined,
      };
    } catch {
      // ignore non-JSON tool output
    }
  }

  return {};
}

export async function callCursorSubprocessTool(args: {
  jobId: string;
  server: CursorMcpServerKind;
  toolName: string;
  arguments?: Record<string, unknown>;
  mobileConfig?: MobileConfig;
  /** Default true — keep MULTI_TC for stop-segment. Cleanup close must pass false. */
  segmentManaged?: boolean;
  /** Bypass multi-TC close guard in the spawned MCP process. */
  forceClose?: boolean;
}): Promise<CursorMcpToolResult> {
  setAutomationJobId(args.jobId);
  let client: Client | undefined;

  try {
    client = await connectStdioMcp(args);
    const result = await client.callTool({
      name: args.toolName,
      arguments: args.arguments ?? {},
    });
    if (result.isError) {
      const content = Array.isArray(result.content) ? result.content : [];
      const msg =
        content.find((part): part is { type: "text"; text: string } =>
          typeof part === "object" && part !== null && "type" in part && part.type === "text"
        )?.text ?? "Tool error";
      logger.warn(`Cursor MCP tool error: ${args.toolName} job=${args.jobId}: ${msg}`);
      return { warning: msg };
    }
    const parsed = parseToolResult(result);
    logger.info(`Cursor MCP tool ok: ${args.toolName} job=${args.jobId}`);
    return parsed;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.warn(`Cursor MCP tool failed: ${args.toolName} job=${args.jobId}: ${msg}`);
    return { warning: msg };
  } finally {
    await client?.close().catch(() => undefined);
  }
}
