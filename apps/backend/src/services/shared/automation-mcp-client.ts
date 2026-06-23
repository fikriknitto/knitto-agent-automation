import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { createInProcessMcpClient } from "../../automation/in-process-mcp-client.js";

export async function connectAutomationMcp(): Promise<Client> {
  return createInProcessMcpClient();
}
