import { defineTool, ToolError } from "../../../platforms/browser/core/index.js";
import { waitFor } from "../interactions.js";
import { waitForInputSchema, waitForOutputShape } from "../schema.js";

export const mobile_wait_for = defineTool({
  name: "mobile_wait_for",
  description: "Wait for locator, text in page source, or a fixed timeout.",
  inputSchema: waitForInputSchema,
  outputSchema: waitForOutputShape,
  handler: async (args) => {
    try {
      return await waitFor({
        type: args.type,
        text: args.text,
        locator: args.locator,
        timeoutMs: args.timeoutMs,
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      throw new ToolError(`Wait failed: ${msg}`);
    }
  },
});
