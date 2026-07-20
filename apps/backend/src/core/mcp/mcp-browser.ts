import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { createLogger } from "../logging.js";
import { closeBrowserFromStateFile } from "../../platforms/browser/driver/session.js";

const logger = createLogger("bridge-mcp-browser");

export const AUTOMATION_CLOSE_BROWSER_TOOL = "browser_close_browser";

export async function closeAutomationBrowser(
  client?: Client | null,
  options?: { alwaysUseStateFile?: boolean }
): Promise<void> {
  if (client) {
    try {
      await client.callTool({ name: AUTOMATION_CLOSE_BROWSER_TOOL, arguments: {} });
      if (!options?.alwaysUseStateFile) {
        return;
      }
    } catch (error) {
      logger.warn(
        `MCP close browser tool failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  const closed = await closeBrowserFromStateFile();
  if (closed) {
    logger.info("Browser closed via state file");
  } else if (!options?.alwaysUseStateFile) {
    logger.warn("No automation browser session found to close");
  }
}
