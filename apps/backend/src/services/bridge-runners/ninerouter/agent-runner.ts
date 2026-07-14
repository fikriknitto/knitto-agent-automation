import { createLogger } from "../../../automation/core/index.js";
import { connectAutomationMcp } from "../../shared/automation-mcp-client.js";
import { setAutomationJobId } from "../../../automation/libs/job-context.js";
import { buildOpenAIUserContent, buildPromptForJob } from "../../shared/prompt-builder.js";
import { resolveMemoryAppIdForJob } from "../../shared/resolve-memory-app-id-for-job.js";
import {
  cleanupJobAttachments,
  loadVisionAttachments,
  resolveJobAttachments,
} from "../../shared/persist-attachments.js";
import { ensureJobScreenshot, extractScreenshotBase64 } from "../../shared/tool-screenshot.js";
import { jobMediaPayload, jobMediaPayloadAsync } from "../../shared/job-media-payload.js";
import { agentMessages } from "../../shared/agent-messages.js";
import { closeMcpSession } from "../../shared/mcp-session-cleanup.js";
import {
  resolveHybridMobileConfig,
  resolveJobTestCasesAsync,
  shouldUseOrchestrator,
} from "../../shared/test-case-parser.js";
import { executeMultiTestBridgeJob } from "../../shared/multi-test-bridge.js";
import { createNineRouterTestCaseRunner } from "../../shared/multi-test-ninerouter.js";
import type { AgentJobMessage, BridgeJob } from "@knitto/shared";
import config from "./config.js";
import { runOpenAIAgentLoop, type ChatMessage } from "./openai-agent.js";

const logger = createLogger("bridge-ninerouter");

export type JobProgressEmitter = (msg: AgentJobMessage) => void;

export interface BridgeJobHandle {
  promise: Promise<void>;
  cancel: () => Promise<void>;
}

type TerminalOutcome =
  | { kind: "completed"; result: string }
  | { kind: "cancelled" }
  | { kind: "error"; message: string };

export function startBridgeJob(job: BridgeJob, emit: JobProgressEmitter): BridgeJobHandle {
  const abortController = new AbortController();
  let cancelled = false;

  const cancel = async (): Promise<void> => {
    cancelled = true;
    abortController.abort();
  };

  const promise = (async () => {
    const creds = config.ninerouterCredentials;
    if (!creds.baseUrl.trim()) {
      throw new Error(
        "9Router belum dikonfigurasi — set NINEROUTER_BASE_URL di .env atau simpan di panel Bridge credentials"
      );
    }

    const savedAttachments = await resolveJobAttachments(job.attachments);
    const visionAttachments = await loadVisionAttachments(job.attachments);
    const platform = job.platform ?? "browser";
    const { testCases, errors } = await resolveJobTestCasesAsync(job);

    if (errors.length) {
      emit({
        type: "agent_job",
        id: job.id,
        channel: job.channel,
        status: "error",
        message: errors.join(" "),
        progress: 100,
      });
      return;
    }

    const modelId = job.model ?? config.modelId;
    if (!modelId) {
      throw new Error("Model belum dipilih — pilih model 9Router di Web UI atau set NINEROUTER_MODEL");
    }

    if (shouldUseOrchestrator(platform, testCases)) {
      const hybridMobileConfig =
        platform === "hybrid"
          ? resolveHybridMobileConfig(testCases, job.mobileConfig)
          : undefined;
      await executeMultiTestBridgeJob({
        job: {
          ...job,
          testCases,
          ...(hybridMobileConfig ? { mobileConfig: hybridMobileConfig } : {}),
        },
        testCases,
        emit,
        isCancelled: () => cancelled,
        startingMessage: agentMessages.startingNineRouter,
        createRunner: (mcpClient) =>
          createNineRouterTestCaseRunner(mcpClient, modelId, abortController.signal),
      });
      return;
    }

    const memoryAppId = await resolveMemoryAppIdForJob({
      platform,
      text: job.text,
      mobileConfig: job.mobileConfig,
      promptBasePaths: job.promptBasePaths,
    });
    const promptInput = buildPromptForJob({
      platform,
      mobileConfig: job.mobileConfig,
      channel: job.channel,
      text: job.text,
      strategy: job.strategy,
      attachments: job.attachments,
      visionAttachments,
      savedAttachments,
      promptBasePaths: job.promptBasePaths,
      memoryAppId,
    });

    const messages: ChatMessage[] = [
      { role: "user", content: buildOpenAIUserContent(promptInput) },
    ];

    emit({
      type: "agent_job",
      id: job.id,
      channel: job.channel,
      status: "running",
      message: agentMessages.startingNineRouter,
      progress: 5,
    });

    const mcpClient = await connectAutomationMcp(job.id, platform, job.mobileConfig);

    if (platform === "mobile") {
      const { prepareMobileJobSession } = await import("../../shared/mobile-job-setup.js");
      await prepareMobileJobSession(job.id, job.mobileConfig);
    }

    let lastTool = "";
    let lastScreenshot: string | undefined;
    let terminal: TerminalOutcome | null = null;

    const timeout = setTimeout(() => {
      if (!cancelled) abortController.abort();
    }, config.jobTimeoutMs);

    try {
      if (cancelled) {
        terminal = { kind: "cancelled" };
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
            message: agentMessages.rateLimitedRetry(attempt, maxRetries, delaySec),
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
                ...jobMediaPayload(job.id),
              });
            }
          }
        },
      });

      if (cancelled) {
        terminal = { kind: "cancelled" };
        return;
      }

      lastScreenshot = await ensureJobScreenshot(mcpClient, lastScreenshot);
      terminal = { kind: "completed", result: summary };
    } catch (error) {
      if (cancelled || abortController.signal.aborted) {
        terminal = { kind: "cancelled" };
      } else {
        terminal = {
          kind: "error",
          message: error instanceof Error ? error.message : String(error),
        };
      }
    } finally {
      clearTimeout(timeout);
      await closeMcpSession(mcpClient, platform, platform === "mobile" ? job.id : undefined);
      setAutomationJobId(null);
      const media = await jobMediaPayloadAsync(job.id, platform);

      if (terminal?.kind === "completed") {
        emit({
          type: "agent_job",
          id: job.id,
          channel: job.channel,
          status: "completed",
          message: agentMessages.completed,
          progress: 100,
          result: terminal.result,
          ...media,
        });
      } else if (terminal?.kind === "cancelled") {
        emit({
          type: "agent_job",
          id: job.id,
          channel: job.channel,
          status: "cancelled",
          message: agentMessages.cancelled,
          ...media,
        });
      } else if (terminal?.kind === "error") {
        emit({
          type: "agent_job",
          id: job.id,
          channel: job.channel,
          status: "error",
          message: terminal.message,
          progress: 100,
          ...media,
        });
      }

      await mcpClient.close().catch(() => undefined);
      await cleanupJobAttachments(job.id);
    }
  })();

  return { promise, cancel };
}
