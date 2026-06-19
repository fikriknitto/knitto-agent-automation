import type {
  ShapeOutput,
  ZodRawShapeCompat,
} from "@modelcontextprotocol/sdk/server/zod-compat.js";

export type { ShapeOutput, ZodRawShapeCompat };

export type JsonPrimitive = string | number | boolean | null;
export type JsonObject = { [key: string]: JsonValue };
export type JsonArray = JsonValue[];
export type JsonValue = JsonPrimitive | JsonObject | JsonArray;

export interface ServerConfig {
  name: string;
  version: string;
}

export interface ToolDefinition<
  TInput extends ZodRawShapeCompat = ZodRawShapeCompat,
  TResult extends JsonValue | void = JsonObject,
> {
  name: string;
  description: string;
  inputSchema: TInput;
  outputSchema?: ZodRawShapeCompat;
  handler: (args: ShapeOutput<TInput>) => Promise<TResult> | TResult;
}

export interface PromptMessage {
  role: "user" | "assistant";
  content: {
    type: "text";
    text: string;
  };
}

export interface PromptResult {
  messages: PromptMessage[];
  description?: string;
}

export interface PromptDefinition<
  TArgs extends ZodRawShapeCompat = ZodRawShapeCompat,
> {
  name: string;
  description: string;
  argsSchema?: TArgs;
  handler: (args: ShapeOutput<TArgs>) => Promise<PromptResult> | PromptResult;
}
