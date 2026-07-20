import { existsSync } from "node:fs";
import { defineTool, ToolError } from "../../core/index.js";
import { getAutomationJobId } from "../job-context.js";
import { stopBrowserSegment, resolveAgentVideoPath } from "../browser/recording.js";
import { getActiveTestCaseId } from "../../../services/shared/segment-context.js";
import {
  clearActiveSegment,
  clearSegmentStopRequest,
  readSegmentStateFile,
  requestSegmentStop,
  waitForSegmentInactive,
} from "../../../services/shared/segment-state-file.js";
import { testCaseVideoFilenameForId } from "@knitto/shared";
import {
  stopTestCaseSegmentInputSchema,
  stopTestCaseSegmentOutputShape,
} from "../schema.js";

export const automation_stop_test_case_segment = defineTool({
  name: "browser_stop_test_case_segment",
  description:
    "Stop the active per-test-case browser video segment (multi-TC orchestrator use).",
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

    let path = await stopBrowserSegment();
    if (path) {
      clearActiveSegment(jobId);
      clearSegmentStopRequest(jobId);
      return { stopped: true, path };
    }

    const inactive = await waitForSegmentInactive(jobId, testCaseId, 8000);
    const expectedPath = resolveAgentVideoPath(jobId, testCaseVideoFilenameForId(testCaseId));
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
