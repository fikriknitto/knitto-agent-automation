import { defineTool, ToolError } from "../core/index.js";
import { getAutomationJobId } from "../job-context.js";
import { isMultiTcCloseBlocked } from "../../../core/evidence/segment-context.js";
import { closeBrowser } from "../driver/session.js";
import { closeBrowserOutputShape } from "../schema.js";

const MULTI_TC_CLOSE_MSG =
  "Multi-TC job — orchestrator menutup platform setelah semua TC selesai.";

export const automation_close_browser = defineTool({
  name: "browser_close_browser",
  description: "Close the Puppeteer browser session and all open pages.",
  inputSchema: {},
  outputSchema: closeBrowserOutputShape,
  handler: async () => {
    const jobId = getAutomationJobId();
    if (jobId && isMultiTcCloseBlocked(jobId)) {
      throw new ToolError(MULTI_TC_CLOSE_MSG);
    }
    await closeBrowser();
    return { closed: true };
  },
});
