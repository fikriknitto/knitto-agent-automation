import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  terminateMobileAppFromState,
  terminateMobileAppBestEffort,
} from "./mobile-session-cleanup.js";

describe("terminateMobileAppFromState", () => {
  it("returns false when no state file exists", async () => {
    const result = await terminateMobileAppFromState("job-no-state-xyz");
    assert.equal(result, false);
  });
});

describe("terminateMobileAppBestEffort", () => {
  it("returns false when appPackage missing", async () => {
    const result = await terminateMobileAppBestEffort({ jobId: "job-no-pkg" });
    assert.equal(result, false);
  });
});
