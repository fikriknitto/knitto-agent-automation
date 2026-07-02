import { defineTool, ToolError } from "../../../automation/core/index.js";
import { launchApp } from "../driver/session.js";
import { launchAppInputSchema, launchAppOutputShape } from "../schema.js";

export const mobile_launch_app = defineTool({
  name: "mobile_launch_app",
  description:
    "Launch or activate the target Android app for this job (package from UI selection). Use deep link when configured.",
  inputSchema: launchAppInputSchema,
  outputSchema: launchAppOutputShape,
  handler: async () => {
    try {
      return await launchApp();
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      throw new ToolError(`Failed to launch app: ${msg}`);
    }
  },
});
