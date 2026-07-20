import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isRecordablePageUrl } from "./session.js";

describe("isRecordablePageUrl", () => {
  it("rejects about:blank", () => {
    assert.equal(isRecordablePageUrl("about:blank"), false);
  });

  it("accepts real URLs", () => {
    assert.equal(isRecordablePageUrl("https://example.com/login"), true);
  });
});
