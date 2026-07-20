import { existsSync } from "node:fs";
import { defineTool, ToolError } from "../../../platforms/mcp-kit/core/index.js";
import { getAutomationJobId } from "../job-context.js";
import { getDriver, hasActiveSession } from "../driver/session.js";
import {
  isMobileSegmentRecording,
  resolveMobileVideoPath,
  stopMobileSegment,
} from "../session/recording.js";
import { getActiveTestCaseId } from "../../../core/evidence/segment-context.js";
import {
  clearActiveSegment,
  clearSegmentStopRequest,
  readSegmentStateFile,
  requestSegmentStop,
  waitForSegmentInactive,
} from "../../../core/evidence/segment-state-file.js";
import { testCaseVideoFilenameForId } from "@knitto/shared";
import {
  stopTestCaseSegmentInputSchema,
  stopTestCaseSegmentOutputShape,
} from "../../../platforms/browser/schema.js";

export const mobile_stop_test_case_segment = defineTool({
  name: "mobile_stop_test_case_segment",
  description:
    "Stop the active per-test-case mobile video segment (multi-TC orchestrator use).",
  inputSchema: stopTestCaseSegmentInputSchema,
  outputSchema: stopTestCaseSegmentOutputShape,
  handler: async (args) => {
    const jobId = getAutomationJobId();
    if (!jobId) throw new ToolError("Job ID belum diset.");

    const state = readSegmentStateFile(jobId);
    const testCaseId =
      args.testCaseId?.trim() ||
      getActiveTestCaseId() ||
      state?.active?.testCaseId ||
      state?.stopRequested?.testCaseId;

    if (!testCaseId) {
      return { stopped: false, warning: "No active test case segment to stop." };
    }

    requestSegmentStop(jobId, testCaseId);

    let path: string | undefined;
    if (hasActiveSession(jobId) && isMobileSegmentRecording(jobId)) {
      const filename =
        state?.active?.filename ?? testCaseVideoFilenameForId(testCaseId);
      const driver = await getDriver();
      path = await stopMobileSegment(driver, jobId, filename);
      if (path) {
        clearActiveSegment(jobId);
        clearSegmentStopRequest(jobId);
        return { stopped: true, path };
      }
    }

    const inactive = await waitForSegmentInactive(jobId, testCaseId, 8000);
    const expectedPath = resolveMobileVideoPath(jobId, testCaseVideoFilenameForId(testCaseId));
    if (!path && existsSync(expectedPath)) {
      path = expectedPath;
    }

    clearSegmentStopRequest(jobId);

    const output: { stopped: boolean; path?: string; warning?: string } = {
      stopped: inactive || Boolean(path),
    };
    if (path) output.path = path;
    if (!inactive) output.warning = "Segment stop timed out — video may be incomplete.";
    return output;
  },
});
