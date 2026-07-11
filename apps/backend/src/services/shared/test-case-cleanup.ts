import type { MobileConfig, TestCaseSpec } from "@knitto/shared";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { createLogger } from "../../automation/core/index.js";
import { setAutomationJobId } from "../../automation/libs/job-context.js";
import { callCursorSubprocessTool } from "./cursor-mcp-tool-runner.js";

const logger = createLogger("test-case-cleanup");

export type TestCaseCleanupMode = "in-process" | "cursor-subprocess";

async function callInProcessTool(
  mcpClient: Client,
  toolName: string
): Promise<void> {
  try {
    await mcpClient.callTool({ name: toolName, arguments: {} });
    logger.info(`In-process MCP tool ok: ${toolName}`);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.warn(`In-process MCP tool failed: ${toolName}: ${msg}`);
  }
}

/** Close platforms once at end of multi-TC job via MCP tools (platform-aware). */
export async function cleanupJobPlatforms(args: {
  mcpClient: Client;
  jobId: string;
  testCases: TestCaseSpec[];
  mobileConfig?: MobileConfig;
  cleanupMode?: TestCaseCleanupMode;
}): Promise<void> {
  const { mcpClient, jobId, testCases, mobileConfig } = args;
  const cleanupMode = args.cleanupMode ?? "in-process";
  setAutomationJobId(jobId);

  const usedBrowser = testCases.some((tc) => tc.platform === "browser");
  const usedMobile = testCases.some((tc) => tc.platform === "mobile");

  if (!usedBrowser && !usedMobile) return;

  if (cleanupMode === "cursor-subprocess") {
    if (usedBrowser) {
      await callCursorSubprocessTool({
        jobId,
        server: "browser",
        toolName: "automation_close_browser",
      });
    }
    if (usedMobile) {
      await callCursorSubprocessTool({
        jobId,
        server: "mobile",
        toolName: "mobile_close_app",
        mobileConfig,
      });
      await callCursorSubprocessTool({
        jobId,
        server: "mobile",
        toolName: "mobile_close_session",
        mobileConfig,
      });
    }
    logger.info(`Job platforms closed via Cursor MCP tools: job=${jobId}`);
    return;
  }

  if (usedBrowser) {
    await callInProcessTool(mcpClient, "automation_close_browser");
  }
  if (usedMobile) {
    await callInProcessTool(mcpClient, "mobile_close_app");
    await callInProcessTool(mcpClient, "mobile_close_session");
  }
  logger.info(`Job platforms closed via in-process MCP tools: job=${jobId}`);
}
