import { defineTool, ToolError } from "../../core/index.js";
import { hoverLocator } from "../browser/interactions.js";
import { hoverInputSchema, hoverOutputShape } from "../schema.js";

export const automation_hover = defineTool({
  name: "automation_hover",
  description:
    "Hover over an element before clicking menus, dropdowns, or tooltips. Uses semantic locator.",
  inputSchema: hoverInputSchema,
  outputSchema: hoverOutputShape,
  handler: async (args) => {
    try {
      return await hoverLocator(args.locator);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      throw new ToolError(`Failed to hover: ${msg}`);
    }
  },
});
