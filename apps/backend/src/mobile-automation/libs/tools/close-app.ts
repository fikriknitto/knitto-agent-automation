import { defineTool, ToolError } from "../../../automation/core/index.js";
import { closeApp } from "../driver/session.js";
import { closeAppInputSchema, closeAppOutputShape } from "../schema.js";

export const mobile_close_app = defineTool({
  name: "mobile_close_app",
  description:
    "Force-stop the target Android app (terminateApp). Keeps the Appium session open — use before mobile_close_session when done testing. Fails if the session is already closed; always call before mobile_close_session.",
  inputSchema: closeAppInputSchema,
  outputSchema: closeAppOutputShape,
  handler: async () => {
    try {
      return await closeApp();
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      throw new ToolError(`Failed to close app: ${msg}`);
    }
  },
});
