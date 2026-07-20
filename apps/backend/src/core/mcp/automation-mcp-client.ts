import type { AutomationPlatform, MobileConfig } from "@knitto/shared";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { setAutomationJobId } from "../../platforms/browser/job-context.js";
import { createInProcessMcpClient } from "../../platforms/browser/in-process-mcp-client.js";
import { createInProcessMobileMcpClient } from "../../platforms/mobile/in-process-mcp-client.js";
import { setMobileJobConfig } from "../../platforms/mobile/session/mobile-job-context.js";
import {
  clearApiDataJobToken,
  setApiDataJobToken,
} from "../../infra/api-data/api-data-job-context.js";
import { createHybridMcpClient } from "./hybrid-mcp-client.js";

export async function connectAutomationMcp(
  jobId?: string,
  platform: AutomationPlatform = "browser",
  mobileConfig?: MobileConfig,
  apiDataToken?: string
): Promise<Client> {
  setAutomationJobId(jobId ?? null);
  setApiDataJobToken(apiDataToken);
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

export function disconnectAutomationMcpJobContext(): void {
  setAutomationJobId(null);
  clearApiDataJobToken();
}

export { setActiveTestCaseMobileConfig } from "./hybrid-mcp-client.js";
