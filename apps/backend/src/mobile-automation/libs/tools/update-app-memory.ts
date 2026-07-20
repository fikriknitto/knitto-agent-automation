import { defineTool, ToolError } from "../../../automation/core/index.js";
import { writeAppMemory as writeDisk, sanitizeAppId } from "../memory/store.js";
import { updateAppMemoryInputSchema, updateAppMemoryOutputShape } from "../schema.js";
import { putAgentAppMemory } from "../../../services/api-data/agent-memory-client.js";
import { getApiDataJobToken } from "../../../services/api-data/api-data-job-context.js";

export const mobile_update_app_memory = defineTool({
  name: "mobile_update_app_memory",
  description:
    "Persist mobile app learnings after a test run. Use appPackage as appId. Default mode upsert_section replaces that section only (requires sectionKey). Use replace only to overwrite the entire memory file. Never append — updates must replace.",
  inputSchema: updateAppMemoryInputSchema,
  outputSchema: updateAppMemoryOutputShape,
  handler: async (args) => {
    try {
      const token = getApiDataJobToken();
      const mode = args.mode ?? "upsert_section";
      if (token) {
        const row = await putAgentAppMemory({
          scope: "mobile",
          appId: args.appId,
          content: args.content,
          mode,
          sectionKey: args.sectionKey,
          token,
        });
        const safeId = sanitizeAppId(args.appId);
        const body = row.content ?? "";
        return {
          appId: safeId,
          path: `api-data://agent/app-memory/mobile/${safeId}`,
          mode,
          bytesWritten: Buffer.byteLength(body, "utf8"),
        };
      }
      return writeDisk(args.appId, args.content, mode, args.sectionKey);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      throw new ToolError(`Failed to update app memory: ${msg}`);
    }
  },
});
