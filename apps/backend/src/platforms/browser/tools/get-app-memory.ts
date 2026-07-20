import { defineTool, ToolError } from "../../mcp-kit/core/index.js";
import { readAppMemory as readDisk, sanitizeAppId } from "../memory/store.js";
import { getAppMemoryInputSchema, getAppMemoryOutputShape } from "../schema.js";
import { getAgentAppMemory } from "../../../infra/api-data/agent-memory-client.js";
import { getApiDataJobToken } from "../../../infra/api-data/api-data-job-context.js";

export const automation_get_app_memory = defineTool({
  name: "browser_get_app_memory",
  description:
    "Read persisted app knowledge before testing. Returns markdown notes about URLs, flows, and semantic locators. For browser use appId = host:port from target URL when IPv4 (e.g. 192.168.20.27:5420). Do not invent product names. Do not rely on data-testid.",
  inputSchema: getAppMemoryInputSchema,
  outputSchema: getAppMemoryOutputShape,
  handler: async (args) => {
    try {
      const token = getApiDataJobToken();
      if (token) {
        const row = await getAgentAppMemory("browser", args.appId, token);
        const safeId = sanitizeAppId(args.appId);
        return {
          appId: safeId,
          content: row.content ?? "",
          exists: Boolean(row.exists),
          path: `api-data://agent/app-memory/browser/${safeId}`,
        };
      }
      return readDisk(args.appId);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      throw new ToolError(`Failed to read app memory: ${msg}`);
    }
  },
});
