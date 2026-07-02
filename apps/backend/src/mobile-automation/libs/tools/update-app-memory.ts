import { defineTool, ToolError } from "../../../automation/core/index.js";
import { writeAppMemory } from "../memory/store.js";
import { updateAppMemoryInputSchema, updateAppMemoryOutputShape } from "../schema.js";

export const mobile_update_app_memory = defineTool({
  name: "mobile_update_app_memory",
  description:
    "Persist mobile app learnings after a test run. Use appPackage as appId.",
  inputSchema: updateAppMemoryInputSchema,
  outputSchema: updateAppMemoryOutputShape,
  handler: async (args) => {
    try {
      return writeAppMemory(args.appId, args.content, args.mode ?? "append");
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      throw new ToolError(`Failed to update app memory: ${msg}`);
    }
  },
});
