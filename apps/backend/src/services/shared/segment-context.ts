import type { TestCasePlatform } from "@knitto/shared";

export type PendingSegment = {
  testCaseId: string;
  filename: string;
  platform: TestCasePlatform;
};

const managedJobs = new Set<string>();
const pendingByJob = new Map<string, PendingSegment>();
const startedSegments = new Set<string>();
let activeTestCaseId: string | null = null;

function segmentKey(jobId: string, testCaseId: string): string {
  return `${jobId}:${testCaseId}`;
}

export function markJobSegmentManaged(jobId: string): void {
  managedJobs.add(jobId);
}

export function isJobSegmentManaged(jobId: string): boolean {
  return managedJobs.has(jobId);
}

export function isMultiTcCloseBlocked(jobId?: string | null): boolean {
  if (process.env.AUTOMATION_MULTI_TC === "1" || process.env.MOBILE_MULTI_TC === "1") {
    return true;
  }
  return Boolean(jobId && isJobSegmentManaged(jobId));
}

export function clearJobSegmentManaged(jobId: string): void {
  managedJobs.delete(jobId);
  pendingByJob.delete(jobId);
}

export function setPendingSegment(jobId: string, segment: PendingSegment): void {
  pendingByJob.set(jobId, segment);
}

export function getPendingSegment(jobId: string): PendingSegment | undefined {
  return pendingByJob.get(jobId);
}

export function clearPendingSegment(jobId: string): void {
  pendingByJob.delete(jobId);
}

export function markSegmentStarted(jobId: string, testCaseId: string): void {
  startedSegments.add(segmentKey(jobId, testCaseId));
}

export function isSegmentStarted(jobId: string, testCaseId: string): boolean {
  return startedSegments.has(segmentKey(jobId, testCaseId));
}

export function clearSegmentStarted(jobId: string, testCaseId: string): void {
  startedSegments.delete(segmentKey(jobId, testCaseId));
}

export function setActiveTestCaseId(testCaseId: string | null): void {
  activeTestCaseId = testCaseId?.trim() || null;
}

export function getActiveTestCaseId(): string | null {
  return activeTestCaseId;
}
