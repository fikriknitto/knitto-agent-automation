import { defineTool, ToolError } from "../../../automation/core/index.js";
import { getAutomationJobId } from "../job-context.js";
import { isMultiTcCloseBlocked } from "../../../services/shared/segment-context.js";
import { closeApp } from "../driver/session.js";
import { closeAppInputSchema, closeAppOutputShape } from "../schema.js";

const MULTI_TC_CLOSE_MSG =
  "Multi-TC job — orchestrator menutup platform setelah semua TC selesai.";

export const mobile_close_app = defineTool({
  name: "mobile_close_app",
  description:
    "Force-stop the target Android app (terminateApp). Keeps the Appium session open — use before mobile_close_session when done testing. Fails if the session is already closed; always call before mobile_close_session.",
  inputSchema: closeAppInputSchema,
  outputSchema: closeAppOutputShape,
  handler: async () => {
    const jobId = getAutomationJobId();
    if (jobId && isMultiTcCloseBlocked(jobId)) {
      throw new ToolError(MULTI_TC_CLOSE_MSG);
    }
    try {
      return await closeApp();
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      throw new ToolError(`Failed to close app: ${msg}`);
    }
  },
});
