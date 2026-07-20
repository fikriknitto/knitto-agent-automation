import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { createInProcessMcpClient } from "../../automation/in-process-mcp-client.js";
import { createInProcessMobileMcpClient } from "../../mobile-automation/in-process-mcp-client.js";
import type { MobileConfig } from "@knitto/shared";
import { setMobileJobConfig } from "../../mobile-automation/libs/mobile-job-context.js";

export function setActiveTestCaseMobileConfig(
  jobId: string,
  mobileConfig?: MobileConfig
): void {
  if (mobileConfig?.appPackage) {
    setMobileJobConfig(jobId, mobileConfig);
  }
}

export async function createHybridMcpClient(
  jobId: string,
  defaultMobileConfig?: MobileConfig
): Promise<Client> {
  const browserClient = await createInProcessMcpClient();
  const mobileClient = await createInProcessMobileMcpClient();

  if (defaultMobileConfig?.appPackage) {
    setMobileJobConfig(jobId, defaultMobileConfig);
  }

  const browserTools = await browserClient.listTools();
  const mobileTools = await mobileClient.listTools();
  const tools = [...browserTools.tools, ...mobileTools.tools];

  return {
    listTools: async () => ({ tools }),
    callTool: async (params, ...rest) => {
      const name = params.name;
      if (name.startsWith("mobile_")) {
        return mobileClient.callTool(params, ...rest) as Promise<CallToolResult>;
      }
      if (name.startsWith("browser_") || name.startsWith("automation_")) {
        return browserClient.callTool(params, ...rest) as Promise<CallToolResult>;
      }
      return browserClient.callTool(params, ...rest) as Promise<CallToolResult>;
    },
    close: async () => {
      await browserClient.close().catch(() => undefined);
      await mobileClient.close().catch(() => undefined);
    },
  } as Client;
}
