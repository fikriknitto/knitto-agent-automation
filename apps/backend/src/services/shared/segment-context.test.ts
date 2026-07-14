import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import {
  clearJobSegmentManaged,
  clearPendingSegment,
  clearSegmentStarted,
  getPendingSegment,
  isJobSegmentManaged,
  isSegmentStarted,
  markJobSegmentManaged,
  markSegmentStarted,
  setPendingSegment,
} from "./segment-context.js";

describe("segment-context", () => {
  afterEach(() => {
    clearJobSegmentManaged("job-test-1");
  });

  it("tracks pending segment until started and cleared", () => {
    const jobId = "job-test-1";
    markJobSegmentManaged(jobId);
    assert.equal(isJobSegmentManaged(jobId), true);

    setPendingSegment(jobId, {
      testCaseId: "tc-01",
      filename: "tc-01.mp4",
      platform: "browser",
    });
    assert.deepEqual(getPendingSegment(jobId)?.testCaseId, "tc-01");
    assert.equal(isSegmentStarted(jobId, "tc-01"), false);

    markSegmentStarted(jobId, "tc-01");
    assert.equal(isSegmentStarted(jobId, "tc-01"), true);

    clearSegmentStarted(jobId, "tc-01");
    clearPendingSegment(jobId);
    clearJobSegmentManaged(jobId);
    assert.equal(getPendingSegment(jobId), undefined);
    assert.equal(isJobSegmentManaged(jobId), false);
  });
});
