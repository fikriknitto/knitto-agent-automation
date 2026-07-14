import { defineTool, ToolError } from "../../core/index.js";
import { writeAppMemory } from "../memory/store.js";
import { updateAppMemoryInputSchema, updateAppMemoryOutputShape } from "../schema.js";

export const automation_update_app_memory = defineTool({
  name: "automation_update_app_memory",
  description:
    "Persist learnings after a test run (URLs, locator hints, quirks). Default mode upsert_section replaces that section only (requires sectionKey). Use replace only to overwrite the entire memory file. For browser appId use host:port from the target URL when IPv4 (e.g. 192.168.20.27:5420) — never invent product names like knitto-cms.",
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
