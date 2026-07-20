import { createLogger } from "../logging.js";
import { ToolError } from "../errors.js";

const logger = createLogger("browser-lock");

let ownerJobId: string | null = null;

export function getBrowserLockOwner(): string | null {
  return ownerJobId;
}

export function isBrowserLocked(): boolean {
  return ownerJobId != null;
}

/**
 * Claim exclusive browser ownership for a job.
 * Re-entrant for the same jobId. Throws if another job holds the lock.
 */
export function acquireBrowserLock(jobId: string): void {
  const id = jobId.trim();
  if (!id) return;

  if (ownerJobId && ownerJobId !== id) {
    throw new ToolError(
      `Browser sedang dipakai job ${ownerJobId}. Tunggu job selesai atau batalkan dulu.`
    );
  }

  if (ownerJobId !== id) {
    ownerJobId = id;
    logger.child({ agentJobId: id }).info("Browser lock acquired");
  }
}

export function releaseBrowserLock(jobId: string): void {
  const id = jobId.trim();
  if (!id) return;
  if (ownerJobId === id) {
    ownerJobId = null;
    logger.child({ agentJobId: id }).info("Browser lock released");
  }
}

/** Force-clear lock (e.g. after hard browser close when job context is gone). */
export function clearBrowserLock(): void {
  if (ownerJobId) {
    logger.child({ agentJobId: ownerJobId }).info("Browser lock cleared");
  }
  ownerJobId = null;
}

export function getBrowserLockSnapshot(): {
  busy: boolean;
  jobId: string | null;
} {
  return { busy: ownerJobId != null, jobId: ownerJobId };
}
