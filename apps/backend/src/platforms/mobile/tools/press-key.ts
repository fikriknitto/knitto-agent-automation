import { defineTool, ToolError } from "../../../platforms/mcp-kit/core/index.js";
import { pressMobileKey } from "../driver/interactions.js";
import { pressKeyInputSchema, pressKeyOutputShape } from "../schema.js";

export const mobile_press_key = defineTool({
  name: "mobile_press_key",
  description: "Press an Android key: BACK, HOME, ENTER, TAB, DEL, MENU.",
  inputSchema: pressKeyInputSchema,
  outputSchema: pressKeyOutputShape,
  handler: async (args) => {
    try {
      return await pressMobileKey(args.key);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      throw new ToolError(`Failed to press key: ${msg}`);
    }
  },
});
