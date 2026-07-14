import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  clearMobileSessionState,
  readMobileSessionState,
  writeMobileSessionState,
} from "./mobile-session-state.js";

describe("mobile-session-state", () => {
  const jobId = "job-state-test-1";

  it("writes, reads, and clears session state", () => {
    writeMobileSessionState(jobId, {
      jobId,
      sessionId: "abc-session",
      udid: "emulator-5554",
      appPackage: "com.example.app",
    });

    const state = readMobileSessionState(jobId);
    assert.equal(state?.sessionId, "abc-session");
    assert.equal(state?.udid, "emulator-5554");
    assert.equal(state?.appPackage, "com.example.app");

    clearMobileSessionState(jobId);
    assert.equal(readMobileSessionState(jobId), undefined);
  });

  it("returns undefined for missing job", () => {
    assert.equal(readMobileSessionState("nonexistent-job-xyz"), undefined);
  });
});
