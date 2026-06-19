import { defineTool, ToolError } from "../../core/index.js";
import { resolveLocator } from "../browser/locators.js";
import { getPage } from "../browser/session.js";
import { fillInputSchema, interactionOutputShape } from "../schema.js";

export const automation_fill = defineTool({
  name: "automation_fill",
  description:
    "Fill an input using a semantic locator. Clears the field first unless clear=false.",
  inputSchema: fillInputSchema,
  outputSchema: interactionOutputShape,
  handler: async (args) => {
    try {
      const page = await getPage();
      const handle = await resolveLocator(page, args.locator);
      if (args.clear ?? true) {
        await handle.click({ clickCount: 3 });
        await page.keyboard.press("Backspace");
      }
      await handle.type(args.value);
      return { success: true, locator: args.locator };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      throw new ToolError(`Failed to fill: ${msg}`);
    }
  },
});
