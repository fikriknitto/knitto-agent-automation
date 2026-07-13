import type { MobileConfig } from "@knitto/shared";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { createLogger } from "../../automation/core/index.js";
import { setAutomationJobId } from "../../automation/libs/job-context.js";
import { resolveMonorepoRoot } from "../../config/paths.js";
import config from "../bridge-runners/cursor/config.js";
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
}): Promise<Client> {
  const mcpCommand = config.automationMcpCommand;
  const cwd = resolveMonorepoRoot();

  let command: string;
  let spawnArgs: string[];
  let env: Record<string, string>;

  if (args.server === "mobile") {
    const mobilePath = resolveMobileMcpPath();
    const spawn = automationMcpSpawnArgs({ command: mcpCommand, mcpPath: mobilePath });
    command = spawn.command;
    spawnArgs = spawn.args;
    env = Object.fromEntries(
      Object.entries(mobileMcpEnv(args.jobId, args.mobileConfig, { segmentManaged: true })).filter(
        ([, v]) => v
      )
    );
  } else {
    const browserPath = resolveAutomationMcpPath();
    const spawn = automationMcpSpawnArgs({ command: mcpCommand, mcpPath: browserPath });
    command = spawn.command;
    spawnArgs = spawn.args;
    env = Object.fromEntries(
      Object.entries(automationMcpEnv(args.jobId, { segmentManaged: true })).filter(([, v]) => v)
    );
  }

  const transport = new StdioClientTransport({
    command,
    args: spawnArgs,
    env: { ...process.env, ...env } as Record<string, string>,
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
