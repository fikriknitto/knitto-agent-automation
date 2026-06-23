import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import config, { nineRouterApiV1, type NinerouterCredentials } from "./config.js";
import { NineRouterApiError, withNineRouterRetry, type RetryCallback } from "./retry.js";

type JsonObject = Record<string, unknown>;

export type OpenAIContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

export type AssistantChatMessage = {
  role: "assistant";
  content?: string | null;
  tool_calls?: Array<{
    id: string;
    type: "function";
    function: { name: string; arguments: string };
  }>;
};

export type ChatMessage =
  | { role: "user"; content: string | OpenAIContentPart[] }
  | AssistantChatMessage
  | { role: "tool"; tool_call_id: string; content: string };

export type OpenAIFunctionTool = {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: JsonObject;
  };
};

async function nineRouterChatCompletionOnce(
  creds: NinerouterCredentials,
  body: JsonObject,
  signal?: AbortSignal
): Promise<JsonObject> {
  const url = `${nineRouterApiV1(creds.baseUrl)}/chat/completions`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (creds.apiKey) headers.Authorization = `Bearer ${creds.apiKey}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal,
    });
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error(String(error));
  }

  const payload = (await response.json().catch(() => ({}))) as JsonObject;
  if (!response.ok) {
    const err = payload.error as { message?: string } | undefined;
    throw new NineRouterApiError(
      err?.message ?? `9Router chat failed (${response.status})`,
      response.status
    );
  }

  return payload;
}

export async function nineRouterChatCompletion(
  creds: NinerouterCredentials,
  body: JsonObject,
  opts?: {
    signal?: AbortSignal;
    maxRetries?: number;
    retryDelayMs?: number;
    onRetry?: RetryCallback;
  }
): Promise<JsonObject> {
  const maxRetries = opts?.maxRetries ?? config.maxRetries;
  const baseDelayMs = opts?.retryDelayMs ?? config.retryDelayMs;

  return withNineRouterRetry(() => nineRouterChatCompletionOnce(creds, body, opts?.signal), {
    maxRetries,
    baseDelayMs,
    signal: opts?.signal,
    onRetry: opts?.onRetry,
  });
}

export function mcpToolsToOpenAI(
  tools: Array<{ name: string; description?: string; inputSchema?: JsonObject }>
): OpenAIFunctionTool[] {
  return tools.map((tool) => ({
    type: "function",
    function: {
      name: tool.name,
      description: tool.description ?? "",
      parameters: normalizeJsonSchema(tool.inputSchema),
    },
  }));
}

function normalizeJsonSchema(schema: JsonObject | undefined): JsonObject {
  if (!schema || typeof schema !== "object") {
    return { type: "object", properties: {} };
  }
  if (schema.type === "object" || schema.properties) return schema;
  return { type: "object", properties: schema };
}

export function formatMcpToolResult(result: CallToolResult | Record<string, unknown>): string {
  if ("content" in result && Array.isArray(result.content)) {
    return result.content
      .map((part) => {
        if (typeof part === "object" && part && "type" in part && part.type === "text" && "text" in part) {
          return String(part.text);
        }
        return JSON.stringify(part);
      })
      .join("\n");
  }
  return JSON.stringify(result);
}

export async function runOpenAIAgentLoop(opts: {
  creds: NinerouterCredentials;
  model: string;
  messages: ChatMessage[];
  mcpClient: Client;
  maxToolCalls: number;
  maxRetries?: number;
  retryDelayMs?: number;
  signal?: AbortSignal;
  onTool: (phase: "start" | "complete", toolName: string, result?: unknown) => void;
  onRetry?: RetryCallback;
}): Promise<string> {
  const listed = await opts.mcpClient.listTools();
  const tools = mcpToolsToOpenAI(listed.tools);

  const messages: ChatMessage[] = [...opts.messages];

  for (let step = 0; step < opts.maxToolCalls; step++) {
    const payload = await nineRouterChatCompletion(
      opts.creds,
      {
        model: opts.model,
        messages,
        tools,
        tool_choice: "auto",
      },
      {
        signal: opts.signal,
        maxRetries: opts.maxRetries,
        retryDelayMs: opts.retryDelayMs,
        onRetry: opts.onRetry,
      }
    );

    const choice = (payload.choices as Array<{ message?: AssistantChatMessage; finish_reason?: string }>)?.[0];
    const message = choice?.message;
    if (!message) {
      throw new Error("9Router returned no assistant message");
    }

    messages.push(message);

    const toolCalls = message.tool_calls;
    if (!toolCalls?.length || choice.finish_reason === "stop") {
      const text = typeof message.content === "string" ? message.content.trim() : "";
      return text || "Done";
    }

    for (const toolCall of toolCalls) {
      const toolName = toolCall.function.name;
      let args: Record<string, unknown> = {};
      try {
        args = JSON.parse(toolCall.function.arguments || "{}") as Record<string, unknown>;
      } catch {
        args = {};
      }

      opts.onTool("start", toolName);
      const result = await opts.mcpClient.callTool({ name: toolName, arguments: args });
      opts.onTool("complete", toolName, result);

      messages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: formatMcpToolResult(result),
      });
    }
  }

  throw new Error(`Exceeded maximum tool calls (${opts.maxToolCalls})`);
}
