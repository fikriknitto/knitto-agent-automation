import { defineTool, ToolError } from "../../mcp-kit/core/index.js";
import { navigatePage } from "../driver/session.js";
import { navigateInputSchema, navigateOutputShape } from "../schema.js";

export const automation_navigate = defineTool({
  name: "browser_navigate",
  description: "Open a URL in the browser session.",
  inputSchema: navigateInputSchema,
  outputSchema: navigateOutputShape,
  handler: async (args) => {
    try {
      return await navigatePage(args.url, args.waitUntil ?? "domcontentloaded");
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      throw new ToolError(`Failed to navigate: ${msg}`);
    }
  },
});
