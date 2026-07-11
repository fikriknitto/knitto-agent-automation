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
      Object.entries(mobileMcpEnv(args.jobId, args.mobileConfig)).filter(([, v]) => v)
    );
  } else {
    const browserPath = resolveAutomationMcpPath();
    const spawn = automationMcpSpawnArgs({ command: mcpCommand, mcpPath: browserPath });
    command = spawn.command;
    spawnArgs = spawn.args;
    env = Object.fromEntries(
      Object.entries(automationMcpEnv(args.jobId)).filter(([, v]) => v)
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

export async function callCursorSubprocessTool(args: {
  jobId: string;
  server: CursorMcpServerKind;
  toolName: string;
  mobileConfig?: MobileConfig;
}): Promise<void> {
  setAutomationJobId(args.jobId);
  let client: Client | undefined;

  try {
    client = await connectStdioMcp(args);
    await client.callTool({ name: args.toolName, arguments: {} });
    logger.info(`Cursor MCP tool ok: ${args.toolName} job=${args.jobId}`);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.warn(`Cursor MCP tool failed: ${args.toolName} job=${args.jobId}: ${msg}`);
  } finally {
    await client?.close().catch(() => undefined);
  }
}
