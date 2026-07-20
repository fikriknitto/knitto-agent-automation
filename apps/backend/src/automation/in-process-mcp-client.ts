import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { ToolError } from "./core/index.js";
import {
  automation_get_app_memory,
  automation_update_app_memory,
  automation_navigate,
  automation_get_page_snapshot,
  automation_click,
  automation_click_at,
  automation_fill,
  automation_assert_text,
  automation_assert_visible,
  automation_take_screenshot,
  automation_scroll,
  automation_press_key,
  automation_hover,
  automation_select_option,
  automation_wait_for,
  automation_go_back,
  automation_go_forward,
  automation_upload_file,
  automation_close_browser,
  automation_stop_test_case_segment,
} from "./libs/registry.js";

/** Browser MCP tools — names are `browser_*` (W6 cutover). */
const ALL_TOOLS = [
  automation_get_app_memory,
  automation_update_app_memory,
  automation_navigate,
  automation_get_page_snapshot,
  automation_click,
  automation_click_at,
  automation_fill,
  automation_assert_text,
  automation_assert_visible,
  automation_take_screenshot,
  automation_scroll,
  automation_press_key,
  automation_hover,
  automation_select_option,
  automation_wait_for,
  automation_go_back,
  automation_go_forward,
  automation_upload_file,
  automation_close_browser,
  automation_stop_test_case_segment,
] as const;

type AnyTool = (typeof ALL_TOOLS)[number];

function toJsonSafe(value: unknown): unknown {
  if (value === null || value === undefined) return null;
  if (typeof value === "bigint") return value.toString();
  if (value instanceof Date) return value.toISOString();
  if (Buffer.isBuffer(value)) return value.toString("base64");
  if (Array.isArray(value)) return value.map(toJsonSafe);
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      if (k === "__proto__" || k === "constructor" || k === "prototype") continue;
      out[k] = toJsonSafe(v);
    }
    return out;
  }
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }
  return String(value);
}

async function invokeTool(tool: AnyTool, args: Record<string, unknown>): Promise<CallToolResult> {
  try {
    const result = await tool.handler(args as never);
    const hasOutputSchema = tool.outputSchema !== undefined;

    if (hasOutputSchema) {
      if (result == null) {
        throw new ToolError("Tool handler returned no result.");
      }
      const structured = toJsonSafe(result) as Record<string, unknown>;
      const text = JSON.stringify(structured, null, 2);
      return { content: [{ type: "text", text }], structuredContent: structured };
    }

    const text =
      result == null
        ? "{}"
        : typeof result === "string"
          ? String(result)
          : JSON.stringify(toJsonSafe(result), null, 2);
    return { content: [{ type: "text", text }] };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      content: [{ type: "text", text: message }],
      isError: true,
    };
  }
}

export function createInProcessMcpClient(): Client {
  const tools = ALL_TOOLS.map((tool) => ({
    name: tool.name,
    description: tool.description,
    inputSchema: tool.inputSchema,
  }));

  return {
    listTools: async () => ({ tools }),
    callTool: async (params: { name: string; arguments?: Record<string, unknown> }) => {
      const tool = ALL_TOOLS.find((t) => t.name === params.name);
      if (!tool) {
        return {
          content: [{ type: "text", text: `Unknown tool: ${params.name}` }],
          isError: true,
        };
      }
      return invokeTool(tool, params.arguments ?? {});
    },
    close: async () => undefined,
  } as Client;
}

export { ALL_TOOLS };
