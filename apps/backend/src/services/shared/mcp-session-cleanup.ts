import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import type { AutomationPlatform } from "@knitto/shared";
import { cleanupMobileJob } from "./mobile-job-cleanup.js";

export async function closeMcpSession(
  client: Client,
  platform: AutomationPlatform = "browser",
  jobId?: string
): Promise<void> {
  if (platform === "mobile" && jobId) {
    await cleanupMobileJob(jobId);
    return;
  }

  const toolName =
    platform === "mobile" ? "mobile_close_session" : "automation_close_browser";
  try {
    await client.callTool({ name: toolName, arguments: {} });
  } catch {
    // best-effort cleanup
  }
}
