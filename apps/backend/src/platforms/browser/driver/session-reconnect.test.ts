import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { connectBrowserFromStateFile } from "./session.js";

describe("connectBrowserFromStateFile", () => {
  it("returns null when no state file exists", async () => {
    const result = await connectBrowserFromStateFile();
    assert.equal(result, null);
  });
});
