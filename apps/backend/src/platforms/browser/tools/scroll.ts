import { defineTool, ToolError } from "../core/index.js";
import { scrollPage } from "../driver/interactions.js";
import { scrollInputSchema, scrollOutputShape } from "../schema.js";

export const automation_scroll = defineTool({
  name: "browser_scroll",
  description:
    "Scroll the page or a specific element (up/down/top/bottom). Use after snapshot when content is below the fold.",
  inputSchema: scrollInputSchema,
  outputSchema: scrollOutputShape,
  handler: async (args) => {
    try {
      return await scrollPage({
        direction: args.direction,
        amount: args.amount,
        locator: args.locator,
        smooth: args.smooth,
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      throw new ToolError(`Failed to scroll: ${msg}`);
    }
  },
});
