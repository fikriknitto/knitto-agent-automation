import { defineTool, ToolError } from "../../../automation/core/index.js";
import { readAppMemory } from "../memory/store.js";
import { getAppMemoryInputSchema, getAppMemoryOutputShape } from "../schema.js";

export const mobile_get_app_memory = defineTool({
  name: "mobile_get_app_memory",
  description:
    "Read persisted mobile app knowledge (flows, locator hints). Use appPackage as appId.",
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
