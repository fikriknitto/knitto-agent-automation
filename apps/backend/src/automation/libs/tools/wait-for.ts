import { defineTool, ToolError } from "../../core/index.js";
import { waitForCondition } from "../browser/interactions.js";
import { waitForInputSchema, waitForOutputShape } from "../schema.js";

export const automation_wait_for = defineTool({
  name: "automation_wait_for",
  description:
    "Wait for text on page, an element to appear, network idle (SPA loads), or a fixed delay.",
  inputSchema: waitForInputSchema,
  outputSchema: waitForOutputShape,
  handler: async (args) => {
    try {
      return await waitForCondition({
        type: args.type,
        text: args.text,
        locator: args.locator,
        match: args.match,
        timeoutMs: args.timeoutMs,
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      throw new ToolError(`Wait failed: ${msg}`);
    }
  },
});
