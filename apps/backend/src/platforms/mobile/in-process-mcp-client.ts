import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { ToolError } from "../browser/core/index.js";
import {
  mobile_launch_app,
  mobile_get_screen_snapshot,
  mobile_tap,
  mobile_tap_at,
  mobile_scroll,
  mobile_input_text,
  mobile_take_screenshot,
  mobile_upload_file,
  mobile_get_app_memory,
  mobile_update_app_memory,
  mobile_press_key,
  mobile_assert_visible,
  mobile_wait_for,
  mobile_close_app,
  mobile_close_session,
  mobile_stop_test_case_segment,
} from "./registry.js";

const ALL_TOOLS = [
  mobile_launch_app,
  mobile_get_screen_snapshot,
  mobile_tap,
  mobile_tap_at,
  mobile_scroll,
  mobile_input_text,
  mobile_take_screenshot,
  mobile_upload_file,
  mobile_get_app_memory,
  mobile_update_app_memory,
  mobile_press_key,
  mobile_assert_visible,
  mobile_wait_for,
  mobile_close_app,
  mobile_close_session,
  mobile_stop_test_case_segment,
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
    const message = error instanceof Error ? error.message : "Unknown error";
    return { isError: true, content: [{ type: "text", text: message }] };
  }
}

export function createInProcessMobileMcpClient(): Client {
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
          isError: true,
          content: [{ type: "text", text: `Unknown tool: ${params.name}` }],
        };
      }
      const args =
        params.arguments && typeof params.arguments === "object"
          ? (params.arguments as Record<string, unknown>)
          : {};
      return invokeTool(tool, args);
    },
    close: async () => undefined,
  } as unknown as Client;
}

export { ALL_TOOLS };
