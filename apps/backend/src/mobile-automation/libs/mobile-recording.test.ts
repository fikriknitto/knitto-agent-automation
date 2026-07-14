import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, it } from "node:test";
import type { Browser } from "webdriverio";
import { setAutomationJobId } from "../../automation/libs/job-context.js";
import {
  clearJobSegmentManaged,
  markJobSegmentManaged,
  setPendingSegment,
} from "../../services/shared/segment-context.js";
import {
  ensureMobileSegmentRecording,
  isMobileJobRecording,
  isMobileSegmentRecording,
  isSegmentRecordingManaged,
  startMobileJobRecording,
} from "./recording.js";

function mockDriver(): Browser {
  return {
    startRecordingScreen: async () => undefined,
    stopRecordingScreen: async () => Buffer.from("fake-video-bytes").toString("base64"),
  } as unknown as Browser;
}

describe("mobile-recording segment parity", () => {
  const prevMobileMultiTc = process.env.MOBILE_MULTI_TC;
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
    if (prevMobileMultiTc === undefined) delete process.env.MOBILE_MULTI_TC;
    else process.env.MOBILE_MULTI_TC = prevMobileMultiTc;
    setAutomationJobId(null);
    clearJobSegmentManaged("job-mobile-seg-1");
  });

  function useTempScreenshotRoot(): void {
    previousScreenshotDir = process.env.AUTOMATION_SCREENSHOT_DIR;
    screenshotRoot = mkdtempSync(join(tmpdir(), "knitto-mobile-rec-"));
    process.env.AUTOMATION_SCREENSHOT_DIR = screenshotRoot;
  }

  it("isSegmentRecordingManaged is true when MOBILE_MULTI_TC=1", () => {
    delete process.env.MOBILE_MULTI_TC;
    assert.equal(isSegmentRecordingManaged("job-x"), false);

    process.env.MOBILE_MULTI_TC = "1";
    assert.equal(isSegmentRecordingManaged("job-x"), true);
  });

  it("startMobileJobRecording skips when MOBILE_MULTI_TC=1", async () => {
    process.env.MOBILE_MULTI_TC = "1";
    const jobId = "job-mobile-seg-1";
    setAutomationJobId(jobId);

    const driver = mockDriver();
    await startMobileJobRecording(driver);
    assert.equal(isMobileJobRecording(jobId), false);
    assert.equal(isMobileSegmentRecording(jobId), false);
  });

  it("ensureMobileSegmentRecording upgrades job-level recording to segment", async () => {
    useTempScreenshotRoot();
    delete process.env.MOBILE_MULTI_TC;

    const jobId = "job-mobile-seg-1";
    setAutomationJobId(jobId);
    const driver = mockDriver();

    await startMobileJobRecording(driver);
    assert.equal(isMobileJobRecording(jobId), true);

    markJobSegmentManaged(jobId);
    process.env.MOBILE_MULTI_TC = "1";
    setPendingSegment(jobId, {
      testCaseId: "tc-02",
      filename: "tc-02.mp4",
      platform: "mobile",
      mobileConfig: { appPackage: "com.example.app" },
    });

    const started = await ensureMobileSegmentRecording(driver, jobId);
    assert.equal(started, true);
    assert.equal(isMobileSegmentRecording(jobId), true);
    assert.equal(isMobileJobRecording(jobId), false);
  });
});
