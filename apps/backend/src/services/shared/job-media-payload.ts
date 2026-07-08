import type { AutomationPlatform } from "@knitto/shared";
import { agentScreenshotServeUrls } from "../agent-screenshots.js";
import { agentVideoServeUrl } from "../agent-videos.js";
import { waitForJobVideoReady as waitForBrowserJobVideoReady } from "../../automation/libs/browser/recording.js";
import { waitForMobileJobVideoReady } from "../../mobile-automation/libs/recording.js";

export function jobMediaPayload(
  jobId: string,
  platform: AutomationPlatform = "browser"
): {
  screenshots?: string[];
  videoUrl?: string;
} {
  const screenshots = agentScreenshotServeUrls(jobId);
  const videoUrl = agentVideoServeUrl(jobId, platform);

  return {
    ...(screenshots.length ? { screenshots } : {}),
    ...(videoUrl ? { videoUrl } : {}),
  };
}

/** Wait for recording.mp4 to finish writing, then build WS media fields. */
export async function jobMediaPayloadAsync(
  jobId: string,
  platform: AutomationPlatform = "browser"
): Promise<{
  screenshots?: string[];
  videoUrl?: string;
}> {
  if (platform === "mobile") {
    await waitForMobileJobVideoReady(jobId);
  } else {
    await waitForBrowserJobVideoReady(jobId);
  }
  return jobMediaPayload(jobId, platform);
}

/** @deprecated Use jobMediaPayload */
export function jobScreenshotPayload(jobId: string): { screenshots?: string[] } {
  const { screenshots } = jobMediaPayload(jobId);
  return screenshots?.length ? { screenshots } : {};
}
