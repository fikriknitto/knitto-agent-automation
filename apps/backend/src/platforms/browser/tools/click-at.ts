import { defineTool, ToolError } from "../../mcp-kit/core/index.js";
import { clickAt } from "../driver/interactions.js";
import { clickAtInputSchema, clickAtOutputShape } from "../schema.js";

export const automation_click_at = defineTool({
  name: "browser_click_at",
  description:
    "Click at viewport coordinates (x, y). Fallback after screenshot when snapshot has no ref — e.g. SVG icon not in DOM snapshot. Coordinates are CSS pixels from top-left of viewport.",
  inputSchema: clickAtInputSchema,
  outputSchema: clickAtOutputShape,
  handler: async (args) => {
    try {
      return await clickAt(args.x, args.y);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      throw new ToolError(`Failed to click at (${args.x}, ${args.y}): ${msg}`);
    }
  },
});
