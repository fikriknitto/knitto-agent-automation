import { join } from "node:path";
import { resolveScreenshotDir } from "../../config/paths.js";

let currentJobId: string | null = null;

export function setAutomationJobId(jobId: string | null): void {
  currentJobId = jobId?.trim() || null;
}

export function getAutomationJobId(): string | null {
  const fromEnv = process.env.AUTOMATION_JOB_ID?.trim();
  return currentJobId ?? fromEnv ?? null;
}

export function sanitizeJobId(jobId: string): string {
  const safe = jobId.replace(/[^a-zA-Z0-9_-]/g, "_").replace(/_+/g, "_");
  return safe.slice(0, 128) || "unknown";
}

/** screenshoot/agents/{jobId}/ */
export function resolveAgentScreenshotDirForJob(
  jobId: string,
  screenshotRoot?: string
): string {
  const root = screenshotRoot ?? resolveScreenshotDir();
  return join(root, "agents", sanitizeJobId(jobId));
}

/** screenshoot/agents/{jobId}/ — uses current job context when jobId omitted */
export function resolveAgentScreenshotDir(screenshotRoot?: string): string {
  const jobId = getAutomationJobId();
  const segment = jobId ? sanitizeJobId(jobId) : "unknown";
  const root = screenshotRoot ?? resolveScreenshotDir();
  return join(root, "agents", segment);
}
