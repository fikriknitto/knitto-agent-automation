import type { AutomationPlatform } from "@knitto/shared";
import { agentScreenshotServeUrls } from "../agent-screenshots.js";
import { agentVideoServeUrl, agentVideoServeUrls } from "../agent-videos.js";
import { waitForJobVideoReady as waitForBrowserJobVideoReady } from "../../automation/libs/browser/recording.js";
import { waitForMobileJobVideoReady } from "../../mobile-automation/libs/recording.js";
import { existsSync } from "node:fs";
import { resolveAgentScreenshotDirForJob } from "../../automation/libs/job-context.js";

export function jobMediaPayload(
  jobId: string,
  platform: AutomationPlatform = "browser"
): {
  screenshots?: string[];
  videoUrl?: string;
  videoUrls?: string[];
} {
  const screenshots = agentScreenshotServeUrls(jobId);
  const videoUrls = agentVideoServeUrls(jobId);
  const videoUrl =
    videoUrls[0] ?? agentVideoServeUrl(jobId, platform === "mobile" ? "mobile" : "browser");

  return {
    ...(screenshots.length ? { screenshots } : {}),
    ...(videoUrls.length ? { videoUrls } : {}),
    ...(videoUrl ? { videoUrl } : {}),
  };
}

async function waitForTcVideos(jobId: string, timeoutMs = 8000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const urls = agentVideoServeUrls(jobId);
    if (urls.length > 0) return;
    await new Promise((r) => setTimeout(r, 150));
  }
}

/** Wait for recording files to finish writing, then build WS media fields. */
export async function jobMediaPayloadAsync(
  jobId: string,
  platform: AutomationPlatform = "browser"
): Promise<{
  screenshots?: string[];
  videoUrl?: string;
  videoUrls?: string[];
}> {
  const dir = resolveAgentScreenshotDirForJob(jobId);
  const hasTcVideos = existsSync(dir) &&
    agentVideoServeUrls(jobId).some((u) => /tc-\d+\.mp4/.test(u));

  if (hasTcVideos || platform === "hybrid") {
    await waitForTcVideos(jobId);
  } else if (platform === "mobile") {
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
