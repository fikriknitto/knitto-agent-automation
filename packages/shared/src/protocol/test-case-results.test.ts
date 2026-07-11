import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildMultiTestCaseResultMarkdown,
  screenshotsForTestCase,
} from "./test-case-results.js";
import type { TestCaseResult } from "./bridge.js";

describe("screenshotsForTestCase", () => {
  const toServeUrl = (file: string) => `/api/agent-screenshots/job/${file}`;

  it("prefers tc-id prefixed filenames", () => {
    const urls = screenshotsForTestCase({
      allFiles: ["tc-01-a.png", "tc-02-b.png", "other.png"],
      testCaseId: "tc-01",
      baseline: 0,
      toServeUrl,
    });
    assert.deepEqual(urls, ["/api/agent-screenshots/job/tc-01-a.png"]);
  });

  it("falls back to baseline slice when no prefix match", () => {
    const urls = screenshotsForTestCase({
      allFiles: ["a.png", "b.png", "c.png"],
      testCaseId: "tc-01",
      baseline: 1,
      toServeUrl,
    });
    assert.deepEqual(urls, [
      "/api/agent-screenshots/job/b.png",
      "/api/agent-screenshots/job/c.png",
    ]);
  });
});

describe("buildMultiTestCaseResultMarkdown", () => {
  it("renders per-TC RESULT block", () => {
    const results: TestCaseResult[] = [
      {
        testCaseId: "tc-01",
        title: "Login",
        platform: "browser",
        status: "completed",
        summary: "Berhasil login.",
        videoUrl: "/api/agent-videos/job/tc-01.mp4",
      },
    ];
    const md = buildMultiTestCaseResultMarkdown(results);
    assert.match(md, /## RESULT/);
    assert.match(md, /Test Case 1 — Login/);
    assert.match(md, /tc-01\.mp4/);
  });
});
