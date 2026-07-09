import { defineTool, ToolError } from "../../../automation/core/index.js";
import { closeSession } from "../driver/session.js";
import { closeSessionOutputShape } from "../schema.js";

export const mobile_close_session = defineTool({
  name: "mobile_close_session",
  description:
    "Close the Appium session and release the device back to the pool. Call only after mobile_close_app. Do not call any other mobile tool after this.",
  inputSchema: {},
  outputSchema: closeSessionOutputShape,
  handler: async () => {
    try {
      return await closeSession();
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      throw new ToolError(`Failed to close session: ${msg}`);
    }
  },
});
