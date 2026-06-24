import { agentScreenshotServeUrls } from "../agent-screenshots.js";

/** WS payload fields for all screenshots saved under screenshoot/agents/{jobId}/ */
export function jobScreenshotPayload(jobId: string): { screenshots?: string[] } {
  const screenshots = agentScreenshotServeUrls(jobId);
  return screenshots.length ? { screenshots } : {};
}
