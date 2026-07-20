import { defineTool, ToolError } from "../../../platforms/browser/core/index.js";
import { getAutomationJobId } from "../job-context.js";
import { isMultiTcCloseBlocked } from "../../../core/evidence/segment-context.js";
import { closeSession } from "../driver/session.js";
import { closeSessionOutputShape } from "../schema.js";

const MULTI_TC_CLOSE_MSG =
  "Multi-TC job — orchestrator menutup platform setelah semua TC selesai.";

export const mobile_close_session = defineTool({
  name: "mobile_close_session",
  description:
    "Close the Appium session and release the device back to the pool. Call only after mobile_close_app. Do not call any other mobile tool after this.",
  inputSchema: {},
  outputSchema: closeSessionOutputShape,
  handler: async () => {
    const jobId = getAutomationJobId();
    if (jobId && isMultiTcCloseBlocked(jobId)) {
      throw new ToolError(MULTI_TC_CLOSE_MSG);
    }
    try {
      return await closeSession();
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      throw new ToolError(`Failed to close session: ${msg}`);
    }
  },
});
