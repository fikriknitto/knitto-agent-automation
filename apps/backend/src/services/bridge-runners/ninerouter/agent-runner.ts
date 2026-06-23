import { createLogger } from "../../../automation/core/index.js";
import { connectAutomationMcp } from "../../shared/automation-mcp-client.js";
import { buildAgentPrompt, buildOpenAIUserContent } from "../../shared/prompt-builder.js";
import {
  cleanupJobAttachments,
  persistJobAttachments,
} from "../../shared/persist-attachments.js";
import { ensureJobScreenshot, extractScreenshotBase64 } from "../../shared/tool-screenshot.js";
import { closeAutomationBrowser } from "../../shared/mcp-browser.js";
import type { AgentJobMessage, BridgeJob } from "@knitto/shared";
import config from "./config.js";
import { runOpenAIAgentLoop, type ChatMessage } from "./openai-agent.js";

const logger = createLogger("bridge-ninerouter");

export type JobProgressEmitter = (msg: AgentJobMessage) => void;

export interface BridgeJobHandle {
  promise: Promise<void>;
  cancel: () => Promise<void>;
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
      message: "Cancelled",
    });
  };

  const promise = (async () => {
    const creds = config.ninerouterCredentials;
    if (!creds.baseUrl.trim()) {
      throw new Error(
        "9Router belum dikonfigurasi — set NINEROUTER_BASE_URL di .env atau simpan di panel Bridge credentials"
      );
    }

    const savedAttachments = await persistJobAttachments(job.id, job.attachments);
    const promptInput = buildAgentPrompt({
      channel: job.channel,
      text: job.text,
      strategy: job.strategy,
      attachments: job.attachments,
      savedAttachments,
    });

    const modelId = job.model ?? config.modelId;
    if (!modelId) {
      throw new Error("Model belum dipilih — pilih model 9Router di Web UI atau set NINEROUTER_MODEL");
    }

    const messages: ChatMessage[] = [
      { role: "user", content: buildOpenAIUserContent(promptInput) },
    ];

    emit({
      type: "agent_job",
      id: job.id,
      channel: job.channel,
      status: "running",
      message: "Starting 9Router agent…",
      progress: 5,
    });

    const mcpClient = await connectAutomationMcp();

    let lastTool = "";
    let lastScreenshot: string | undefined;

    const timeout = setTimeout(() => {
      if (!cancelled) abortController.abort();
    }, config.jobTimeoutMs);

    try {
      if (cancelled) {
        emitCancelled();
        return;
      }

      logger.info(`9Router run started (model: ${modelId})`);

      const summary = await runOpenAIAgentLoop({
        creds,
        model: modelId,
        messages,
        mcpClient,
        maxToolCalls: config.maxToolCalls,
        maxRetries: config.maxRetries,
        retryDelayMs: config.retryDelayMs,
        signal: abortController.signal,
        onRetry: (attempt, maxRetries, delayMs, error) => {
          if (cancelled) return;
          const delaySec = Math.round(delayMs / 1000);
          const detail = error instanceof Error ? error.message : String(error);
          logger.warn(`9Router retry ${attempt}/${maxRetries} in ${delaySec}s: ${detail}`);
          emit({
            type: "agent_job",
            id: job.id,
            channel: job.channel,
            status: "running",
            message: `Rate limited — retry ${attempt}/${maxRetries} in ${delaySec}s…`,
            progress: 8,
          });
        },
        onTool: (phase, toolName, result) => {
          if (cancelled) return;

          if (phase === "start" && toolName && toolName !== lastTool) {
            lastTool = toolName;
            emit({
              type: "agent_job",
              id: job.id,
              channel: job.channel,
              status: "running",
              message: `Using ${toolName}…`,
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
                message: "Screenshot captured",
                progress: 50,
                screenshotBase64: screenshot,
                toolName,
              });
            }
          }
        },
      });

      if (cancelled) {
        emitCancelled();
        return;
      }

      lastScreenshot = await ensureJobScreenshot(mcpClient, lastScreenshot);

      emit({
        type: "agent_job",
        id: job.id,
        channel: job.channel,
        status: "completed",
        message: "Completed",
        progress: 100,
        result: summary,
        ...(lastScreenshot ? { screenshotBase64: lastScreenshot } : {}),
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
      await closeAutomationBrowser(mcpClient);
      await mcpClient.close().catch(() => undefined);
      await cleanupJobAttachments(job.id);
    }
  })();

  return { promise, cancel };
}
