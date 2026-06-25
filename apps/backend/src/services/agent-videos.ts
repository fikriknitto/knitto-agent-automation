import { existsSync } from "node:fs";
import { basename, join } from "node:path";
import config from "../automation/libs/config.js";
import {
  resolveAgentScreenshotDirForJob,
  sanitizeJobId,
} from "../automation/libs/job-context.js";

const MP4_EXT = /\.mp4$/i;

export function resolveAgentVideoFile(jobId: string, filename: string): string | null {
  const safeName = basename(filename.trim());
  if (!safeName || safeName !== filename.trim() || !MP4_EXT.test(safeName)) {
    return null;
  }

  const expectedName = config.videoFilename;
  if (safeName !== expectedName) {
    return null;
  }

  const filePath = join(resolveAgentScreenshotDirForJob(jobId), safeName);
  if (!existsSync(filePath)) return null;
  return filePath;
}

export function agentVideoServeUrl(jobId: string): string | undefined {
  const safeJobId = sanitizeJobId(jobId);
  const filename = config.videoFilename;
  const filePath = join(resolveAgentScreenshotDirForJob(jobId), filename);
  if (!existsSync(filePath)) return undefined;

  return `/api/agent-videos/${encodeURIComponent(safeJobId)}/${encodeURIComponent(filename)}`;
}
