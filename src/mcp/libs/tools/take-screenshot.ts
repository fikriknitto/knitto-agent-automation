import { defineTool, ToolError } from "../../core/index.js";
import { takePageScreenshot } from "../browser/screenshot.js";
import { takeScreenshotInputSchema, takeScreenshotOutputShape } from "../schema.js";

export const automation_take_screenshot = defineTool({
  name: "automation_take_screenshot",
  description:
    "Capture a PNG screenshot as evidence. Returns file path and base64 for vision models and the web app live panel.",
  inputSchema: takeScreenshotInputSchema,
  outputSchema: takeScreenshotOutputShape,
  handler: async (args) => {
    try {
      return await takePageScreenshot({
        fullPage: args.fullPage ?? false,
        path: args.path,
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      throw new ToolError(`Failed to take screenshot: ${msg}`);
    }
  },
});
