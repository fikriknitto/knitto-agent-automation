import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import config from "../bridge-runners/ninerouter/config.js";
import { buildOpenAIUserContent } from "./prompt-builder.js";
import type { TestCaseAgentRunner } from "./test-case-orchestrator.js";
import { runOpenAIAgentLoop, type ChatMessage } from "../bridge-runners/ninerouter/openai-agent.js";

export function createNineRouterTestCaseRunner(
  mcpClient: Client,
  modelId: string,
  abortSignal: AbortSignal
): TestCaseAgentRunner {
  return async ({ prompt, isCancelled, onToolProgress }) => {
    if (isCancelled()) {
      return { summary: "", error: "cancelled" };
    }

    const messages: ChatMessage[] = [
      { role: "user", content: buildOpenAIUserContent(prompt) },
    ];

    const observedClient = {
      listTools: (...args: Parameters<Client["listTools"]>) => mcpClient.listTools(...args),
      callTool: async (...args: Parameters<Client["callTool"]>) => {
        const params = args[0];
        onToolProgress(params.name);
        return mcpClient.callTool(...args);
      },
      close: (...args: Parameters<Client["close"]>) => mcpClient.close(...args),
    } as Client;

    const creds = config.ninerouterCredentials;
    const summary = await runOpenAIAgentLoop({
      creds,
      model: modelId,
      messages,
      mcpClient: observedClient,
      maxToolCalls: config.maxToolCalls,
      maxRetries: config.maxRetries,
      retryDelayMs: config.retryDelayMs,
      signal: abortSignal,
      onTool: (phase, toolName) => {
        if (phase === "start" && toolName) onToolProgress(toolName);
      },
    });

    return { summary: summary.trim() || "Selesai." };
  };
}
