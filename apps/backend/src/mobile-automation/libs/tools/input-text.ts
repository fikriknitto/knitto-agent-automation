import { defineTool, ToolError } from "../../../platforms/browser/core/index.js";
import { inputText } from "../interactions.js";
import { inputTextInputSchema, interactionOutputShape } from "../schema.js";

export const mobile_input_text = defineTool({
  name: "mobile_input_text",
  description: "Fill an EditText / input field identified by locator.",
  inputSchema: inputTextInputSchema,
  outputSchema: interactionOutputShape,
  handler: async (args) => {
    try {
      return await inputText({
        locator: args.locator,
        value: args.value,
        clear: args.clear,
        hideKeyboard: args.hideKeyboard,
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      throw new ToolError(`Failed to input text: ${msg}`);
    }
  },
});
