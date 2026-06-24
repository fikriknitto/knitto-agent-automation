import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { setAutomationJobId } from "../../automation/libs/job-context.js";
import { createInProcessMcpClient } from "../../automation/in-process-mcp-client.js";

export async function connectAutomationMcp(jobId?: string): Promise<Client> {
  setAutomationJobId(jobId ?? null);
  return createInProcessMcpClient();
}
