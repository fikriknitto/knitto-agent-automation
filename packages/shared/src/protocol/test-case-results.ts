import type { TestCaseResult } from "./bridge.js";

/** Screenshots captured during a TC — prefer tc-id prefix, fall back to baseline slice. */
export function screenshotsForTestCase(args: {
  allFiles: string[];
  testCaseId: string;
  baseline: number;
  toServeUrl: (filename: string) => string;
}): string[] {
  const { allFiles, testCaseId, baseline, toServeUrl } = args;
  const prefix = `${testCaseId}-`;
  const prefixed = allFiles.filter((name) => name.startsWith(prefix));
  if (prefixed.length > 0) {
    return prefixed.map(toServeUrl);
  }
  return allFiles.slice(baseline).map(toServeUrl);
}

export function buildMultiTestCaseResultMarkdown(testCaseResults: TestCaseResult[]): string {
  if (!testCaseResults.length) return "";

  const lines = ["## RESULT", ""];
  for (const [index, tc] of testCaseResults.entries()) {
    const heading = tc.title?.trim() || tc.testCaseId;
    lines.push(`### Test Case ${index + 1} — ${heading}`);
    lines.push(`- **Status:** ${tc.status}`);
    lines.push(`- **Platform:** ${tc.platform}`);
    if (tc.summary.trim()) {
      lines.push(`- **Ringkasan:** ${tc.summary.trim()}`);
    }
    if (tc.screenshots?.length) {
      lines.push(`- **Screenshot:** ${tc.screenshots.length} file`);
    }
    if (tc.videoUrl) {
      const filename = tc.videoUrl.split("/").pop() ?? tc.videoUrl;
      lines.push(`- **Video:** ${filename}`);
    }
    lines.push("");
  }
  return lines.join("\n").trimEnd();
}

export function buildMultiTestCaseSummaryMarkdown(testCaseResults: TestCaseResult[]): string {
  if (!testCaseResults.length) return "Tidak ada test case yang dijalankan.";

  const lines = testCaseResults.map((tc) => {
    const title = tc.title?.trim() || tc.testCaseId;
    if (tc.status === "error") {
      return `**${tc.testCaseId}** (${tc.platform}): GAGAL — ${tc.summary}`;
    }
    if (tc.status === "skipped") {
      return `**${tc.testCaseId}** (${tc.platform}): Dilewati`;
    }
    return `**${tc.testCaseId}** (${tc.platform}): ${tc.summary}`;
  });

  return `## Ringkasan multi test case\n\n${lines.join("\n\n")}`;
}
