import { defineTool, ToolError } from "../../../platforms/browser/core/index.js";
import { tapElement } from "../interactions.js";
import { interactionOutputShape, tapInputSchema } from "../schema.js";

export const mobile_tap = defineTool({
  name: "mobile_tap",
  description: "Tap an element by semantic locator (ref from snapshot preferred).",
  inputSchema: tapInputSchema,
  outputSchema: interactionOutputShape,
  handler: async (args) => {
    try {
      return await tapElement(args.locator, args.clickCenter);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      throw new ToolError(`Failed to tap: ${msg}`);
    }
  },
});
