import type { AutomationPlatform, MobileConfig } from "@knitto/shared";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { setAutomationJobId } from "../../automation/libs/job-context.js";
import { createInProcessMcpClient } from "../../automation/in-process-mcp-client.js";
import { createInProcessMobileMcpClient } from "../../mobile-automation/in-process-mcp-client.js";
import { setMobileJobConfig } from "../../mobile-automation/libs/mobile-job-context.js";

export async function connectAutomationMcp(
  jobId?: string,
  platform: AutomationPlatform = "browser",
  mobileConfig?: MobileConfig
): Promise<Client> {
  setAutomationJobId(jobId ?? null);
  if (platform === "mobile") {
    if (jobId && mobileConfig) {
      setMobileJobConfig(jobId, mobileConfig);
    }
    return createInProcessMobileMcpClient();
  }
  return createInProcessMcpClient();
}
