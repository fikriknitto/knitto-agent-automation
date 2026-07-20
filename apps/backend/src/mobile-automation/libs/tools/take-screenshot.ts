import { defineTool, ToolError } from "../../../platforms/browser/core/index.js";
import { takeMobileScreenshot } from "../screenshot.js";
import { takeScreenshotInputSchema, takeScreenshotOutputShape } from "../schema.js";

export const mobile_take_screenshot = defineTool({
  name: "mobile_take_screenshot",
  description: "Capture PNG screenshot of the current Android screen.",
  inputSchema: takeScreenshotInputSchema,
  outputSchema: takeScreenshotOutputShape,
  handler: async (args) => {
    try {
      return await takeMobileScreenshot(args.path);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      throw new ToolError(`Failed to take screenshot: ${msg}`);
    }
  },
});
