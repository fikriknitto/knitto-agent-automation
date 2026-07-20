import { defineTool, ToolError } from "../../core/index.js";
import { isLocatorVisible, resolveLocator } from "../browser/locators.js";
import { getPage } from "../browser/session.js";
import { assertVisibleInputSchema, assertVisibleOutputShape } from "../schema.js";

export const automation_assert_visible = defineTool({
  name: "browser_assert_visible",
  description: "Assert that an element resolved by semantic locator is visible on the page.",
  inputSchema: assertVisibleInputSchema,
  outputSchema: assertVisibleOutputShape,
  handler: async (args) => {
    try {
      const page = await getPage();
      await resolveLocator(page, args.locator);
      const visible = await isLocatorVisible(page, args.locator);
      if (!visible) {
        throw new ToolError("Element is not visible.");
      }
      return { success: true, locator: args.locator, visible: true };
    } catch (error) {
      if (error instanceof ToolError) throw error;
      const msg = error instanceof Error ? error.message : String(error);
      throw new ToolError(`Failed to assert visible: ${msg}`);
    }
  },
});
