import { defineTool, ToolError } from "../../../platforms/browser/core/index.js";
import { tapAt } from "../interactions.js";
import { tapAtInputSchema, tapAtOutputShape } from "../schema.js";

export const mobile_tap_at = defineTool({
  name: "mobile_tap_at",
  description: "Tap at screen coordinates (x, y) in pixels.",
  inputSchema: tapAtInputSchema,
  outputSchema: tapAtOutputShape,
  handler: async (args) => {
    try {
      return await tapAt(args.x, args.y);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      throw new ToolError(`Failed to tap at coordinates: ${msg}`);
    }
  },
});
