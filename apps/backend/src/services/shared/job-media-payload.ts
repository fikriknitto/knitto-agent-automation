import { agentScreenshotServeUrls } from "../agent-screenshots.js";
import { agentVideoServeUrl } from "../agent-videos.js";
import { waitForJobVideoReady } from "../../automation/libs/browser/recording.js";

export function jobMediaPayload(jobId: string): {
  screenshots?: string[];
  videoUrl?: string;
} {
  const screenshots = agentScreenshotServeUrls(jobId);
  const videoUrl = agentVideoServeUrl(jobId);

  return {
    ...(screenshots.length ? { screenshots } : {}),
    ...(videoUrl ? { videoUrl } : {}),
  };
}

/** Wait for recording.mp4 to finish writing, then build WS media fields. */
export async function jobMediaPayloadAsync(jobId: string): Promise<{
  screenshots?: string[];
  videoUrl?: string;
}> {
  await waitForJobVideoReady(jobId);
  return jobMediaPayload(jobId);
}

/** @deprecated Use jobMediaPayload */
export function jobScreenshotPayload(jobId: string): { screenshots?: string[] } {
  const { screenshots } = jobMediaPayload(jobId);
  return screenshots?.length ? { screenshots } : {};
}
