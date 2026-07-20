import { defineTool, ToolError } from "../core/index.js";
import { selectOption } from "../driver/interactions.js";
import { selectOptionInputSchema, selectOptionOutputShape } from "../schema.js";

export const automation_select_option = defineTool({
  name: "browser_select_option",
  description:
    "Select an option in a native <select> or combobox/listbox by value or visible label text.",
  inputSchema: selectOptionInputSchema,
  outputSchema: selectOptionOutputShape,
  handler: async (args) => {
    try {
      return await selectOption(args.locator, args.value);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      throw new ToolError(`Failed to select option: ${msg}`);
    }
  },
});
