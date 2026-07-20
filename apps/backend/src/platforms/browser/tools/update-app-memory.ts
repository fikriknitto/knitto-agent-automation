import { defineTool, ToolError } from "../../mcp-kit/core/index.js";
import { writeAppMemory as writeDisk, sanitizeAppId } from "../memory/store.js";
import { updateAppMemoryInputSchema, updateAppMemoryOutputShape } from "../schema.js";
import { putAgentAppMemory } from "../../../infra/api-data/agent-memory-client.js";
import { getApiDataJobToken } from "../../../infra/api-data/api-data-job-context.js";

export const automation_update_app_memory = defineTool({
  name: "browser_update_app_memory",
  description:
    "Persist learnings after a test run (URLs, locator hints, quirks). Default mode upsert_section replaces that section only (requires sectionKey). Use replace only to overwrite the entire memory file. For browser appId use host:port from the target URL when IPv4 (e.g. 192.168.20.27:5420) — never invent product names like knitto-cms.",
  inputSchema: updateAppMemoryInputSchema,
  outputSchema: updateAppMemoryOutputShape,
  handler: async (args) => {
    try {
      const token = getApiDataJobToken();
      const mode = args.mode ?? "upsert_section";
      if (token) {
        const row = await putAgentAppMemory({
          scope: "browser",
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
          path: `api-data://agent/app-memory/browser/${safeId}`,
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
