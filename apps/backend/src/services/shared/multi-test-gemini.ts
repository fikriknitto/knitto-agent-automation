import {
  FunctionCallingConfigMode,
  GoogleGenAI,
  mcpToTool,
} from "@google/genai";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import type { AgentJobMessage } from "@knitto/shared";
import config from "../bridge-runners/gemini/config.js";
import { createLogger } from "../../automation/core/index.js";
import { buildGeminiContents } from "./prompt-builder.js";
import type { TestCaseAgentRunner } from "./test-case-orchestrator.js";

const logger = createLogger("multi-test-gemini");

export function createGeminiTestCaseRunner(
  mcpClient: Client,
  modelId: string,
  abortSignal: AbortSignal
): TestCaseAgentRunner {
  const ai = new GoogleGenAI({ apiKey: config.geminiApiKey! });

  return async ({ prompt, isCancelled, onToolProgress }) => {
    if (isCancelled()) {
      return { summary: "", error: "cancelled" };
    }

    const observedClient = {
      listTools: (...args: Parameters<Client["listTools"]>) => mcpClient.listTools(...args),
      callTool: async (...args: Parameters<Client["callTool"]>) => {
        const params = args[0];
        onToolProgress(params.name);
        return mcpClient.callTool(...args);
      },
      close: (...args: Parameters<Client["close"]>) => mcpClient.close(...args),
    } as Client;

    const contents = buildGeminiContents(prompt);
    const response = await ai.models.generateContent({
      model: modelId,
      contents,
      config: {
        abortSignal,
        tools: [mcpToTool(observedClient)],
        toolConfig: {
          functionCallingConfig: {
            mode: FunctionCallingConfigMode.AUTO,
          },
        },
        automaticFunctionCalling: {
          maximumRemoteCalls: config.maxToolCalls,
        },
      },
    });

    const summary = response.text?.trim() || "Selesai.";
    logger.info(`Gemini TC completed (${summary.length} chars)`);
    return { summary };
  };
}

export type MultiTestEmit = (msg: AgentJobMessage) => void;
