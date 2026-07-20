import { defineTool, ToolError } from "../../mcp-kit/core/index.js";
import { goBack } from "../driver/session.js";
import { historyOutputShape } from "../schema.js";

export const automation_go_back = defineTool({
  name: "browser_go_back",
  description: "Navigate back in browser history (like the back button).",
  inputSchema: {},
  outputSchema: historyOutputShape,
  handler: async () => {
    try {
      return await goBack();
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      throw new ToolError(`Failed to go back: ${msg}`);
    }
  },
});
