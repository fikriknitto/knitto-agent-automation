import { defineTool, ToolError } from "../../core/index.js";
import { writeAppMemory } from "../memory/store.js";
import { updateAppMemoryInputSchema, updateAppMemoryOutputShape } from "../schema.js";

export const automation_update_app_memory = defineTool({
  name: "automation_update_app_memory",
  description:
    "Persist new learnings after a test run (URLs, locator hints, quirks). Use append to add notes or replace to overwrite.",
  inputSchema: updateAppMemoryInputSchema,
  outputSchema: updateAppMemoryOutputShape,
  handler: async (args) => {
    try {
      return writeAppMemory(
        args.appId,
        args.content,
        args.mode ?? "upsert_section",
        args.sectionKey
      );
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      throw new ToolError(`Failed to update app memory: ${msg}`);
    }
  },
});
