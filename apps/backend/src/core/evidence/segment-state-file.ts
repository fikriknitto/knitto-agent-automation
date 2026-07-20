import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import type { TestCasePlatform } from "@knitto/shared";
import { resolveAgentScreenshotDirForJob } from "../job-context.js";
import type { PendingSegment } from "./segment-context.js";

export type ActiveSegment = {
  testCaseId: string;
  filename: string;
  outputPath: string;
  platform: TestCasePlatform;
  startedAt: string;
};

export type SegmentStopRequest = {
  testCaseId: string;
  requestedAt: string;
};

export type SegmentStateFile = {
  managed: boolean;
  pending: PendingSegment | null;
  active: ActiveSegment | null;
  startedTestCases: string[];
  stopRequested: SegmentStopRequest | null;
  activeTestCaseId: string | null;
};

function defaultSegmentState(): SegmentStateFile {
  return {
    managed: false,
    pending: null,
    active: null,
    startedTestCases: [],
    stopRequested: null,
    activeTestCaseId: null,
  };
}

export function segmentStatePath(jobId: string): string {
  return join(resolveAgentScreenshotDirForJob(jobId), ".segment-state.json");
}

export function readSegmentStateFile(jobId: string): SegmentStateFile | null {
  const path = segmentStatePath(jobId);
  if (!existsSync(path)) return null;
  try {
    const raw = readFileSync(path, "utf8");
    const parsed = JSON.parse(raw) as Partial<SegmentStateFile>;
    return {
      ...defaultSegmentState(),
      ...parsed,
      startedTestCases: Array.isArray(parsed.startedTestCases)
        ? parsed.startedTestCases.filter((id): id is string => typeof id === "string")
        : [],
    };
  } catch {
    return null;
  }
}

export function writeSegmentStateFile(jobId: string, state: SegmentStateFile): void {
  const path = segmentStatePath(jobId);
  const tmp = `${path}.tmp`;
  mkdirSync(resolveAgentScreenshotDirForJob(jobId), { recursive: true });
  writeFileSync(tmp, JSON.stringify(state, null, 2), "utf8");
  renameSync(tmp, path);
}

export function updateSegmentStateFile(
  jobId: string,
  updater: (current: SegmentStateFile) => SegmentStateFile
): SegmentStateFile {
  const current = readSegmentStateFile(jobId) ?? defaultSegmentState();
  const next = updater(current);
  writeSegmentStateFile(jobId, next);
  return next;
}

export function deleteSegmentStateFile(jobId: string): void {
  const path = segmentStatePath(jobId);
  try {
    unlinkSync(path);
  } catch {
    // ignore
  }
  try {
    unlinkSync(`${path}.tmp`);
  } catch {
    // ignore
  }
}

export function requestSegmentStop(jobId: string, testCaseId: string): void {
  updateSegmentStateFile(jobId, (state) => ({
    ...state,
    stopRequested: {
      testCaseId,
      requestedAt: new Date().toISOString(),
    },
  }));
}

export function clearSegmentStopRequest(jobId: string): void {
  updateSegmentStateFile(jobId, (state) => ({
    ...state,
    stopRequested: null,
  }));
}

export function setActiveSegment(jobId: string, active: ActiveSegment): void {
  updateSegmentStateFile(jobId, (state) => ({
    ...state,
    active,
    stopRequested: null,
  }));
}

export function clearActiveSegment(jobId: string): void {
  updateSegmentStateFile(jobId, (state) => ({
    ...state,
    active: null,
  }));
}

export async function waitForSegmentInactive(
  jobId: string,
  testCaseId: string,
  timeoutMs = 10_000,
  intervalMs = 200
): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const state = readSegmentStateFile(jobId);
    if (!state?.active || state.active.testCaseId !== testCaseId) {
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  return false;
}
