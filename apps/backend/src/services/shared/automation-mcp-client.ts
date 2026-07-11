import type { AutomationPlatform, MobileConfig } from "@knitto/shared";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { setAutomationJobId } from "../../automation/libs/job-context.js";
import { createInProcessMcpClient } from "../../automation/in-process-mcp-client.js";
import { createInProcessMobileMcpClient } from "../../mobile-automation/in-process-mcp-client.js";
import { setMobileJobConfig } from "../../mobile-automation/libs/mobile-job-context.js";
import { createHybridMcpClient } from "./hybrid-mcp-client.js";

export async function connectAutomationMcp(
  jobId?: string,
  platform: AutomationPlatform = "browser",
  mobileConfig?: MobileConfig
): Promise<Client> {
  setAutomationJobId(jobId ?? null);
  if (platform === "hybrid") {
    if (!jobId) {
      throw new Error("Hybrid jobs require jobId for MCP client");
    }
    return createHybridMcpClient(jobId, mobileConfig);
  }
  if (platform === "mobile") {
    if (jobId && mobileConfig) {
      setMobileJobConfig(jobId, mobileConfig);
    }
    return createInProcessMobileMcpClient();
  }
  return createInProcessMcpClient();
}

export { setActiveTestCaseMobileConfig } from "./hybrid-mcp-client.js";
