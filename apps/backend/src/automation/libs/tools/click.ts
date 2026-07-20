import { defineTool, ToolError } from "../../core/index.js";
import { clickLocator } from "../browser/interactions.js";
import { clickInputSchema, interactionOutputShape } from "../schema.js";

export const automation_click = defineTool({
  name: "browser_click",
  description:
    "Click an element using a semantic locator (ref from snapshot, role+name, label, placeholder, or text). Use clickCenter:true for small SVG/hamburger icons.",
  inputSchema: clickInputSchema,
  outputSchema: interactionOutputShape,
  handler: async (args) => {
    try {
      return await clickLocator(args.locator, args.clickCenter ?? false);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      throw new ToolError(`Failed to click: ${msg}`);
    }
  },
});
