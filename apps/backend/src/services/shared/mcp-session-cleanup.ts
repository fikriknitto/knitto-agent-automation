import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import type { AutomationPlatform } from "@knitto/shared";

export async function closeMcpSession(
  client: Client,
  platform: AutomationPlatform = "browser"
): Promise<void> {
  const toolName =
    platform === "mobile" ? "mobile_close_session" : "automation_close_browser";
  try {
    await client.callTool({ name: toolName, arguments: {} });
  } catch {
    // best-effort cleanup
  }
}
