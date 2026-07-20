import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, it } from "node:test";
import { setAutomationJobId } from "../../automation/libs/job-context.js";
import {
  clearJobSegmentManaged,
  getPendingSegment,
  isJobSegmentManaged,
  markJobSegmentManaged,
  setPendingSegment,
} from "./segment-context.js";
import {
  readSegmentStateFile,
  requestSegmentStop,
  segmentStatePath,
  setActiveSegment,
  waitForSegmentInactive,
} from "./segment-state-file.js";

describe("segment-state-file", () => {
  let screenshotRoot = "";
  let previousScreenshotDir: string | undefined;

  afterEach(() => {
    if (screenshotRoot) {
      rmSync(screenshotRoot, { recursive: true, force: true });
      screenshotRoot = "";
    }
    if (previousScreenshotDir !== undefined) {
      process.env.AUTOMATION_SCREENSHOT_DIR = previousScreenshotDir;
    } else {
      delete process.env.AUTOMATION_SCREENSHOT_DIR;
    }
    setAutomationJobId(null);
  });

  function useTempScreenshotRoot(): string {
    previousScreenshotDir = process.env.AUTOMATION_SCREENSHOT_DIR;
    screenshotRoot = mkdtempSync(join(tmpdir(), "knitto-segment-state-"));
    process.env.AUTOMATION_SCREENSHOT_DIR = screenshotRoot;
    return screenshotRoot;
  }

  it("persists pending segment across process boundaries via file", async () => {
    useTempScreenshotRoot();
    const jobId = "job-file-1";
    setAutomationJobId(jobId);

    markJobSegmentManaged(jobId);
    setPendingSegment(jobId, {
      testCaseId: "tc-01",
      filename: "tc-01.mp4",
      platform: "browser",
    });

    assert.equal(isJobSegmentManaged(jobId), true);
    assert.equal(getPendingSegment(jobId)?.testCaseId, "tc-01");

    const file = readSegmentStateFile(jobId);
    assert.equal(file?.managed, true);
    assert.equal(file?.pending?.testCaseId, "tc-01");
    assert.equal(segmentStatePath(jobId).includes("job-file-1"), true);
  });

  it("tracks active segment and stop request", async () => {
    useTempScreenshotRoot();
    const jobId = "job-file-2";
    setAutomationJobId(jobId);

    setActiveSegment(jobId, {
      testCaseId: "tc-02",
      filename: "tc-02.mp4",
      outputPath: join(screenshotRoot, "agents", "job-file-2", "tc-02.mp4"),
      platform: "browser",
      startedAt: new Date().toISOString(),
    });

    const active = readSegmentStateFile(jobId)?.active;
    assert.equal(active?.testCaseId, "tc-02");

    requestSegmentStop(jobId, "tc-02");
    assert.equal(readSegmentStateFile(jobId)?.stopRequested?.testCaseId, "tc-02");

    clearJobSegmentManaged(jobId);
    assert.equal(readSegmentStateFile(jobId), null);
  });

  it("waitForSegmentInactive returns when active segment cleared", async () => {
    useTempScreenshotRoot();
    const jobId = "job-file-3";
    setAutomationJobId(jobId);

    setActiveSegment(jobId, {
      testCaseId: "tc-03",
      filename: "tc-03.mp4",
      outputPath: join(screenshotRoot, "agents", "job-file-3", "tc-03.mp4"),
      platform: "mobile",
      startedAt: new Date().toISOString(),
    });

    setTimeout(() => {
      void clearJobSegmentManaged(jobId);
    }, 100);

    const inactive = await waitForSegmentInactive(jobId, "tc-03", 2000);
    assert.equal(inactive, true);
  });
});
