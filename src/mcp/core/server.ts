import { McpServer as SdkMcpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import type { CallToolResult, GetPromptResult } from "@modelcontextprotocol/sdk/types.js";
import type { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import type {
  JsonObject,
  JsonValue,
  PromptDefinition,
  ServerConfig,
  ShapeOutput,
  ToolDefinition,
  ZodRawShapeCompat,
} from "./types.js";

export class ToolError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ToolError";
  }
}

function toJsonSafe(value: unknown): JsonValue {
  if (value === null || value === undefined) return null;
  if (typeof value === "bigint") return value.toString();
  if (value instanceof Date) return value.toISOString();
  if (Buffer.isBuffer(value)) return value.toString("base64");
  if (Array.isArray(value)) return value.map(toJsonSafe);
  if (typeof value === "object") {
    const out: JsonObject = {};
    for (const [k, v] of Object.entries(value)) {
      if (k === "__proto__" || k === "constructor" || k === "prototype") {
        continue;
      }
      Reflect.set(out, k, toJsonSafe(v));
    }
    return out;
  }
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }
  return String(value);
}

export function defineTool<
  TInput extends ZodRawShapeCompat,
  TResult extends JsonValue | void = JsonObject,
>(definition: ToolDefinition<TInput, TResult>): ToolDefinition<TInput, TResult> {
  return definition;
}

export function definePrompt<TArgs extends ZodRawShapeCompat>(
  definition: PromptDefinition<TArgs>
): PromptDefinition<TArgs> {
  return definition;
}

export class Server {
  private readonly server: SdkMcpServer;
  private started = false;

  constructor(config: ServerConfig) {
    this.server = new SdkMcpServer({
      name: config.name,
      version: config.version,
    });
  }

  registerTool<TInput extends ZodRawShapeCompat, TResult extends JsonValue | void = JsonValue>(
    definition: ToolDefinition<TInput, TResult>
  ): void {
    const config = {
      title: definition.name,
      description: definition.description,
      inputSchema: definition.inputSchema,
      ...(definition.outputSchema !== undefined
         ? { outputSchema: definition.outputSchema }
         : {}),
    };

    const handler = definition.handler;
    const onCall = async (args: ShapeOutput<TInput>): Promise<CallToolResult> => {
      try {
        const result = await handler(args);
        const hasOutputSchema = definition.outputSchema !== undefined;

        if (hasOutputSchema) {
          if (result == null) {
            throw new ToolError("Tool handler returned no result.");
          }
          const structured = toJsonSafe(result) as JsonObject;
          const text = JSON.stringify(structured, null, 2);
          return {
            content: [{ type: "text", text }],
            structuredContent: structured,
          };
        }

        const text =
          result == null
            ? "{}"
            : typeof result === "string"
              ? result
              : JSON.stringify(toJsonSafe(result), null, 2);
        return { content: [{ type: "text", text }] };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return {
          isError: true,
          content: [{ type: "text", text: message }],
        };
      }
    };

    this.server.registerTool(
      definition.name,
      config,
      onCall as Parameters<SdkMcpServer["registerTool"]>[2]
    );
  }

  registerPrompt<TArgs extends ZodRawShapeCompat>(
    definition: PromptDefinition<TArgs>
  ): void {
    const config = {
      title: definition.name,
      description: definition.description,
      ...(definition.argsSchema !== undefined ? { argsSchema: definition.argsSchema } : {}),
    };

    const handler = definition.handler;

    type RegisterPromptFn = (
      name: string,
      config: object,
      cb: (...args: unknown[]) => Promise<GetPromptResult>
    ) => void;
    const registerPrompt = this.server.registerPrompt.bind(
      this.server
    ) as RegisterPromptFn;

    if (definition.argsSchema !== undefined) {
      registerPrompt(definition.name, config, async (args, _extra) =>
        (await handler(args as ShapeOutput<TArgs>)) as GetPromptResult
      );
      return;
    }

    registerPrompt(definition.name, config, async () =>
      (await handler({} as ShapeOutput<TArgs>)) as GetPromptResult
    );
  }

  async connect(transport: Transport): Promise<void> {
    await this.server.connect(transport);
  }

  async start(): Promise<void> {
    if (this.started) return;
    await this.connect(new StdioServerTransport());
    this.started = true;
  }

  async close(): Promise<void> {
    await this.server.close();
    this.started = false;
  }
}
