import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, it } from "node:test";
import { setAutomationJobId } from "../../automation/libs/job-context.js";
import {
  clearJobSegmentManaged,
  markJobSegmentManaged,
  setPendingSegment,
} from "../../services/shared/segment-context.js";
import { getMobileJobConfig } from "./mobile-job-context.js";

describe("mobile job config from segment state", () => {
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
    clearJobSegmentManaged("job-mobile-cfg-1");
  });

  it("getMobileJobConfig reads appPackage from pending segment file", () => {
    previousScreenshotDir = process.env.AUTOMATION_SCREENSHOT_DIR;
    screenshotRoot = mkdtempSync(join(tmpdir(), "knitto-mobile-cfg-"));
    process.env.AUTOMATION_SCREENSHOT_DIR = screenshotRoot;

    const jobId = "job-mobile-cfg-1";
    setAutomationJobId(jobId);
    markJobSegmentManaged(jobId);
    setPendingSegment(jobId, {
      testCaseId: "tc-02",
      filename: "tc-02.mp4",
      platform: "mobile",
      mobileConfig: { appPackage: "com.baseapprn.development" },
    });

    const cfg = getMobileJobConfig(jobId);
    assert.equal(cfg?.appPackage, "com.baseapprn.development");
  });
});
