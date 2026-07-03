import { defineTool, ToolError } from "../../../automation/core/index.js";
import { scrollScreen } from "../interactions.js";
import { scrollInputSchema, scrollOutputShape } from "../schema.js";

export const mobile_scroll = defineTool({
  name: "mobile_scroll",
  description:
    "Scroll the app content area or a scrollable container (up/down/top/bottom). Full-screen scroll avoids the status bar and navigation bar. Prefer passing locator for a specific list or container (e.g. RecyclerView, ScrollView). Use after snapshot when content is below the fold.",
  inputSchema: scrollInputSchema,
  outputSchema: scrollOutputShape,
  handler: async (args) => {
    try {
      return await scrollScreen({
        direction: args.direction,
        amount: args.amount,
        locator: args.locator,
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      throw new ToolError(`Failed to scroll: ${msg}`);
    }
  },
});
