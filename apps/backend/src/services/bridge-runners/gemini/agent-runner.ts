import {
  FunctionCallingConfigMode,
  GoogleGenAI,
  mcpToTool,
} from "@google/genai";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { createLogger } from "../../../automation/core/index.js";
import { connectAutomationMcp } from "../../shared/automation-mcp-client.js";
import { setAutomationJobId } from "../../../automation/libs/job-context.js";
import { buildPromptForJob, buildGeminiContents } from "../../shared/prompt-builder.js";
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
import { createGeminiTestCaseRunner } from "../../shared/multi-test-gemini.js";
import type { AgentJobMessage, BridgeJob } from "@knitto/shared";
import config from "./config.js";

const logger = createLogger("bridge-gemini");

export type JobProgressEmitter = (msg: AgentJobMessage) => void;

export interface BridgeJobHandle {
  promise: Promise<void>;
  cancel: () => Promise<void>;
}

type TerminalOutcome =
  | { kind: "completed"; result: string }
  | { kind: "cancelled" }
  | { kind: "error"; message: string };

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

  const promise = (async () => {
    if (!config.geminiApiKey) {
      throw new Error(
        "Gemini API key belum tersedia — set GEMINI_API_KEY di .env atau simpan di panel Bridge credentials"
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
        startingMessage: agentMessages.startingGemini,
        createRunner: (mcpClient) =>
          createGeminiTestCaseRunner(mcpClient, job.model ?? config.modelId, abortController.signal),
      });
      return;
    }

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

    const mcpClient = await connectAutomationMcp(job.id, platform, job.mobileConfig);

    if (platform === "mobile") {
      const { prepareMobileJobSession } = await import("../../shared/mobile-job-setup.js");
      await prepareMobileJobSession(job.id, job.mobileConfig);
    }

    let lastTool = "";
    let lastScreenshot: string | undefined;
    let terminal: TerminalOutcome | null = null;

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
            ...jobMediaPayload(job.id),
          });
        }
      }
    });

    const timeout = setTimeout(() => {
      if (!cancelled) abortController.abort();
    }, config.jobTimeoutMs);

    try {
      if (cancelled) {
        terminal = { kind: "cancelled" };
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
        terminal = { kind: "cancelled" };
        return;
      }

      const summary = response.text?.trim() || agentMessages.doneFallback;
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
