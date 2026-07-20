import { existsSync, readdirSync, statSync } from "node:fs";
import { basename, join } from "node:path";
import {
  resolveAgentScreenshotDirForJob,
  sanitizeJobId,
} from "../core/job-context.js";

const PNG_EXT = /\.png$/i;

export function listAgentScreenshotFiles(jobId: string): string[] {
  const dir = resolveAgentScreenshotDirForJob(jobId);
  if (!existsSync(dir)) return [];

  return readdirSync(dir)
    .filter((name) => PNG_EXT.test(name))
    .sort((a, b) => {
      const aTime = statSync(join(dir, a)).mtimeMs;
      const bTime = statSync(join(dir, b)).mtimeMs;
      return aTime - bTime;
    });
}

export function agentScreenshotServeUrls(jobId: string): string[] {
  const safeJobId = sanitizeJobId(jobId);
  return listAgentScreenshotFiles(jobId).map(
    (file) =>
      `/api/agent-screenshots/${encodeURIComponent(safeJobId)}/${encodeURIComponent(file)}`
  );
}

export function resolveAgentScreenshotFile(jobId: string, filename: string): string | null {
  const safeName = basename(filename.trim());
  if (!safeName || safeName !== filename.trim() || !PNG_EXT.test(safeName)) {
    return null;
  }

  const filePath = join(resolveAgentScreenshotDirForJob(jobId), safeName);
  if (!existsSync(filePath)) return null;
  return filePath;
}
