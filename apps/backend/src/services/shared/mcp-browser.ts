import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { createLogger } from "../../automation/core/index.js";
import { closeBrowserFromStateFile } from "../../automation/libs/browser/session.js";

const logger = createLogger("bridge-mcp-browser");

export const AUTOMATION_CLOSE_BROWSER_TOOL = "automation_close_browser";

export async function closeAutomationBrowser(client?: Client | null): Promise<void> {
  if (client) {
    try {
      await client.callTool({ name: AUTOMATION_CLOSE_BROWSER_TOOL, arguments: {} });
      return;
    } catch (error) {
      logger.warn(
        `MCP close browser tool failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  const closed = await closeBrowserFromStateFile();
  if (!closed) {
    logger.warn("No automation browser session found to close");
  }
}
