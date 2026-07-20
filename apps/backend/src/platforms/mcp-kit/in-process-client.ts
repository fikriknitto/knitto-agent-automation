import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { ToolError } from "../../core/errors.js";
import type { ToolDefinition } from "./core/types.js";

// Registry entries are heterogeneous ToolDefinition<TInput, TResult> instances;
// the client only needs their common structural surface.
export type AnyToolDefinition = Pick<
  ToolDefinition,
  "name" | "description" | "inputSchema" | "outputSchema"
> & { handler: (args: never) => unknown };

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

async function invokeTool(
  tool: AnyToolDefinition,
  args: Record<string, unknown>
): Promise<CallToolResult> {
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

export function createInProcessClient(allTools: readonly AnyToolDefinition[]): Client {
  const tools = allTools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    inputSchema: tool.inputSchema,
  }));

  return {
    listTools: async () => ({ tools }),
    callTool: async (params: { name: string; arguments?: Record<string, unknown> }) => {
      const tool = allTools.find((t) => t.name === params.name);
      if (!tool) {
        return {
          content: [{ type: "text", text: `Unknown tool: ${params.name}` }],
          isError: true,
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
