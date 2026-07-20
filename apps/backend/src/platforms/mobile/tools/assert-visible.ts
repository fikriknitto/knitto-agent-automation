import { defineTool, ToolError } from "../../../platforms/mcp-kit/core/index.js";
import { assertVisible } from "../driver/interactions.js";
import { assertVisibleInputSchema, assertVisibleOutputShape } from "../schema.js";

export const mobile_assert_visible = defineTool({
  name: "mobile_assert_visible",
  description: "Assert that an element matching the locator is visible on screen.",
  inputSchema: assertVisibleInputSchema,
  outputSchema: assertVisibleOutputShape,
  handler: async (args) => {
    try {
      return await assertVisible(args.locator);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      throw new ToolError(`Assertion failed: ${msg}`);
    }
  },
});
