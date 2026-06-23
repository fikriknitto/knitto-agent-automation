import { defineTool, ToolError } from "../../core/index.js";
import { getPageText } from "../browser/session.js";
import { assertTextInputSchema, assertTextOutputShape } from "../schema.js";

export const automation_assert_text = defineTool({
  name: "automation_assert_text",
  description: "Assert that the page body text matches the expected string (contains, exact, or regex).",
  inputSchema: assertTextInputSchema,
  outputSchema: assertTextOutputShape,
  handler: async (args) => {
    try {
      const bodyText = await getPageText();
      const match = args.match ?? "contains";
      let success = false;

      if (match === "contains") {
        success = bodyText.includes(args.text);
      } else if (match === "exact") {
        success = bodyText.trim() === args.text.trim();
      } else {
        success = new RegExp(args.text).test(bodyText);
      }

      if (!success) {
        throw new ToolError(
          `Text assertion failed (${match}): expected "${args.text}" in page content.`
        );
      }

      return { success: true, match, text: args.text };
    } catch (error) {
      if (error instanceof ToolError) throw error;
      const msg = error instanceof Error ? error.message : String(error);
      throw new ToolError(`Failed to assert text: ${msg}`);
    }
  },
});
