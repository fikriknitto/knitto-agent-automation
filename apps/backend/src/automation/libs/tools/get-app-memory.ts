import { defineTool, ToolError } from "../../core/index.js";
import { readAppMemory } from "../memory/store.js";
import { getAppMemoryInputSchema, getAppMemoryOutputShape } from "../schema.js";

export const automation_get_app_memory = defineTool({
  name: "automation_get_app_memory",
  description:
    "Read persisted app knowledge before testing. Returns markdown notes about URLs, flows, and semantic locators. Do not rely on data-testid.",
  inputSchema: getAppMemoryInputSchema,
  outputSchema: getAppMemoryOutputShape,
  handler: async (args) => {
    try {
      return readAppMemory(args.appId);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      throw new ToolError(`Failed to read app memory: ${msg}`);
    }
  },
});
