import { defineTool, ToolError } from "../../core/index.js";
import { goForward } from "../browser/session.js";
import { historyOutputShape } from "../schema.js";

export const automation_go_forward = defineTool({
  name: "automation_go_forward",
  description: "Navigate forward in browser history.",
  inputSchema: {},
  outputSchema: historyOutputShape,
  handler: async () => {
    try {
      return await goForward();
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      throw new ToolError(`Failed to go forward: ${msg}`);
    }
  },
});
