import {
  FunctionCallingConfigMode,
  GoogleGenAI,
  mcpToTool,
} from "@google/genai";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { createLogger } from "../../../automation/core/index.js";
import { connectAutomationMcp } from "../../shared/automation-mcp-client.js";
import { setAutomationJobId } from "../../../automation/libs/job-context.js";
import { buildAgentPrompt, buildGeminiContents } from "../../shared/prompt-builder.js";
import {
  cleanupJobAttachments,
  loadVisionAttachments,
  resolveJobAttachments,
} from "../../shared/persist-attachments.js";
import { ensureJobScreenshot, extractScreenshotBase64 } from "../../shared/tool-screenshot.js";
import { jobScreenshotPayload } from "../../shared/job-screenshot-payload.js";
import { agentMessages } from "../../shared/agent-messages.js";
import { closeAutomationBrowser } from "../../shared/mcp-browser.js";
import type { AgentJobMessage, BridgeJob } from "@knitto/shared";
import config from "./config.js";

const logger = createLogger("bridge-gemini");

export type JobProgressEmitter = (msg: AgentJobMessage) => void;

export interface BridgeJobHandle {
  promise: Promise<void>;
  cancel: () => Promise<void>;
}

function observeMcpClient(
  client: Client,
  onTool: (phase: "start" | "complete", toolName: string, result?: unknown) => void
): Client {
  const originalCallTool = client.callTool.bind(client);
  return {
    listTools: (...args: Parameters<Client["listTools"]>) => client.listTools(...args),
    callTool: async (...args: Parameters<Client["callTool"]>) => {
      const params = args[0];
      const toolName = params.name;
      onTool("start", toolName);
      const result = await originalCallTool(...args);
      onTool("complete", toolName, result);
      return result;
    },
    close: (...args: Parameters<Client["close"]>) => client.close(...args),
  } as Client;
}

export function startBridgeJob(job: BridgeJob, emit: JobProgressEmitter): BridgeJobHandle {
  const abortController = new AbortController();
  let cancelled = false;

  const cancel = async (): Promise<void> => {
    cancelled = true;
    abortController.abort();
  };

  const emitCancelled = (): void => {
    emit({
      type: "agent_job",
      id: job.id,
      channel: job.channel,
      status: "cancelled",
      message: agentMessages.cancelled,
    });
  };

  const promise = (async () => {
    if (!config.geminiApiKey) {
      throw new Error(
        "Gemini API key belum tersedia — set GEMINI_API_KEY di .env atau simpan di panel Bridge credentials"
      );
    }

    const savedAttachments = await resolveJobAttachments(job.attachments);
    const visionAttachments = await loadVisionAttachments(job.attachments);
    const promptInput = buildAgentPrompt({
      channel: job.channel,
      text: job.text,
      strategy: job.strategy,
      attachments: job.attachments,
      visionAttachments,
      savedAttachments,
    });

    const modelId = job.model ?? config.modelId;
    const contents = buildGeminiContents(promptInput);

    emit({
      type: "agent_job",
      id: job.id,
      channel: job.channel,
      status: "running",
      message: agentMessages.startingGemini,
      progress: 5,
    });

    const mcpClient = await connectAutomationMcp(job.id);

    let lastTool = "";
    let lastScreenshot: string | undefined;

    const observedClient = observeMcpClient(mcpClient, (phase, toolName, result) => {
      if (cancelled) return;

      if (phase === "start" && toolName && toolName !== lastTool) {
        lastTool = toolName;
        emit({
          type: "agent_job",
          id: job.id,
          channel: job.channel,
          status: "running",
          message: agentMessages.usingTool(toolName),
          progress: 10,
          toolName,
        });
      }

      if (phase === "complete" && toolName) {
        const screenshot = extractScreenshotBase64(toolName, result);
        if (screenshot) {
          lastScreenshot = screenshot;
          emit({
            type: "agent_job",
            id: job.id,
            channel: job.channel,
            status: "running",
            message: agentMessages.screenshotCaptured,
            progress: 50,
            toolName,
            ...jobScreenshotPayload(job.id),
          });
        }
      }
    });

    const timeout = setTimeout(() => {
      if (!cancelled) abortController.abort();
    }, config.jobTimeoutMs);

    try {
      if (cancelled) {
        emitCancelled();
        return;
      }

      logger.info(`Gemini run started (model: ${modelId})`);

      const ai = new GoogleGenAI({ apiKey: config.geminiApiKey });
      const response = await ai.models.generateContent({
        model: modelId,
        contents,
        config: {
          abortSignal: abortController.signal,
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

      if (cancelled) {
        emitCancelled();
        return;
      }

      const summary = response.text?.trim() || agentMessages.doneFallback;
      lastScreenshot = await ensureJobScreenshot(mcpClient, lastScreenshot);

      emit({
        type: "agent_job",
        id: job.id,
        channel: job.channel,
        status: "completed",
        message: agentMessages.completed,
        progress: 100,
        result: summary,
        ...jobScreenshotPayload(job.id),
      });
    } catch (error) {
      if (cancelled || abortController.signal.aborted) {
        emitCancelled();
      } else {
        emit({
          type: "agent_job",
          id: job.id,
          channel: job.channel,
          status: "error",
          message: error instanceof Error ? error.message : String(error),
          progress: 100,
        });
      }
    } finally {
      clearTimeout(timeout);
      setAutomationJobId(null);
      await closeAutomationBrowser(mcpClient);
      await mcpClient.close().catch(() => undefined);
      await cleanupJobAttachments(job.id);
    }
  })();

  return { promise, cancel };
}
