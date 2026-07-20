import { jsonSchema, tool, type ToolSet } from "ai";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

type JsonObject = Record<string, unknown>;

function formatMcpToolResult(result: CallToolResult | Record<string, unknown>): string {
  if ("content" in result && Array.isArray(result.content)) {
    return result.content
      .map((part) => {
        if (
          typeof part === "object" &&
          part &&
          "type" in part &&
          part.type === "text" &&
          "text" in part
        ) {
          return String(part.text);
        }
        return JSON.stringify(part);
      })
      .join("\n");
  }
  return JSON.stringify(result);
}

function normalizeJsonSchema(schema: JsonObject | undefined): JsonObject {
  if (!schema || typeof schema !== "object") {
    return { type: "object", properties: {} };
  }
  if (schema.type === "object" || schema.properties) return schema;
  return { type: "object", properties: schema };
}

/**
 * Map in-process MCP Client tools → AI SDK ToolSet for knitto-agent.
 * Prefers `browser_*` / `mobile_*` names (W6 cutover).
 */
export async function mcpClientToAiToolSet(
  mcpClient: Client,
  opts?: {
    onToolStart?: (toolName: string) => void;
    onToolDone?: (toolName: string, result: unknown) => void;
  }
): Promise<ToolSet> {
  const listed = await mcpClient.listTools();
  const tools: ToolSet = {};

  for (const mcpTool of listed.tools) {
    const name = mcpTool.name;
    const description = mcpTool.description ?? name;
    const parameters = normalizeJsonSchema(mcpTool.inputSchema as JsonObject | undefined);

    tools[name] = tool({
      description,
      inputSchema: jsonSchema(parameters),
      execute: async (args) => {
        opts?.onToolStart?.(name);
        const result = await mcpClient.callTool({
          name,
          arguments: (args ?? {}) as Record<string, unknown>,
        });
        opts?.onToolDone?.(name, result);
        return formatMcpToolResult(result as CallToolResult);
      },
    });
  }

  return tools;
}
