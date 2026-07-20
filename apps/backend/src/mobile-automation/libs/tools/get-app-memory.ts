import { defineTool, ToolError } from "../../../platforms/browser/core/index.js";
import { readAppMemory as readDisk, sanitizeAppId } from "../memory/store.js";
import { getAppMemoryInputSchema, getAppMemoryOutputShape } from "../schema.js";
import { getAgentAppMemory } from "../../../infra/api-data/agent-memory-client.js";
import { getApiDataJobToken } from "../../../infra/api-data/api-data-job-context.js";

export const mobile_get_app_memory = defineTool({
  name: "mobile_get_app_memory",
  description:
    "Read persisted mobile app knowledge (flows, locator hints). Use appPackage as appId.",
  inputSchema: getAppMemoryInputSchema,
  outputSchema: getAppMemoryOutputShape,
  handler: async (args) => {
    try {
      const token = getApiDataJobToken();
      if (token) {
        const row = await getAgentAppMemory("mobile", args.appId, token);
        const safeId = sanitizeAppId(args.appId);
        return {
          appId: safeId,
          content: row.content ?? "",
          exists: Boolean(row.exists),
          path: `api-data://agent/app-memory/mobile/${safeId}`,
        };
      }
      return readDisk(args.appId);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      throw new ToolError(`Failed to read app memory: ${msg}`);
    }
  },
});
