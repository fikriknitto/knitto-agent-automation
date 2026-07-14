import { Agent, CursorAgentError } from "@cursor/sdk";
import { createLogger } from "../../../automation/core/index.js";
import { resolveMonorepoRoot } from "../../../config/paths.js";
import {
  automationMcpSpawnArgs,
  cursorMcpServerConfig,
  resolveMcpPathForJob,
} from "../../shared/automation-mcp-config.js";
import { buildCursorSdkMessage, buildPromptForJob } from "../../shared/prompt-builder.js";
import {
  cleanupJobAttachments,
  loadVisionAttachments,
  resolveJobAttachments,
} from "../../shared/persist-attachments.js";
import { ensureJobScreenshot, extractScreenshotBase64 } from "../../shared/tool-screenshot.js";
import { jobMediaPayload, jobMediaPayloadAsync } from "../../shared/job-media-payload.js";
import { agentMessages } from "../../shared/agent-messages.js";
import { devicePool } from "../../../mobile-automation/libs/driver/device-pool.js";
import { cleanupMobileJob } from "../../shared/mobile-job-cleanup.js";
import {
  setMobileJobConfig,
  setMobileJobUdid,
} from "../../../mobile-automation/libs/mobile-job-context.js";
import {
  resolveHybridMobileConfig,
  resolveJobTestCasesAsync,
  shouldUseOrchestrator,
} from "../../shared/test-case-parser.js";
import { executeMultiTestBridgeJob } from "../../shared/multi-test-bridge.js";
import {
  acquireCursorHybridDevice,
  createCursorTestCaseRunner,
} from "../../shared/multi-test-cursor.js";
import type { AgentJobMessage, BridgeJob } from "@knitto/shared";
import config from "./config.js";

const logger = createLogger("bridge-cursor");

export type JobProgressEmitter = (msg: AgentJobMessage) => void;

export interface BridgeJobHandle {
  promise: Promise<void>;
  cancel: () => Promise<void>;
}

type TerminalOutcome =
  | { kind: "completed"; result: string }
  | { kind: "cancelled" }
  | { kind: "error"; message: string };

function mcpServerConfig(job: BridgeJob, acquiredUdid?: string) {
  const platform = job.platform ?? "browser";
  const mobileConfig =
    (platform === "mobile" || platform === "hybrid") && job.mobileConfig
      ? { ...job.mobileConfig, udid: acquiredUdid ?? job.mobileConfig.udid }
      : job.mobileConfig;
  if ((platform === "mobile" || platform === "hybrid") && mobileConfig) {
    setMobileJobConfig(job.id, mobileConfig);
  }
  const mcpPath = resolveMcpPathForJob(job);
  const spawn = automationMcpSpawnArgs({
    command: config.automationMcpCommand,
    mcpPath,
  });
  return cursorMcpServerConfig({
    command: spawn.command,
    args: spawn.args,
    cwd: resolveMonorepoRoot(),
    jobId: job.id,
    platform,
    mobileConfig,
  });
}

export function startBridgeJob(job: BridgeJob, emit: JobProgressEmitter): BridgeJobHandle {
  let runCancel: (() => Promise<void>) | null = null;
  let cancelled = false;

  const cancel = async (): Promise<void> => {
    cancelled = true;
    if (runCancel) await runCancel();
  };

  const promise = (async () => {
    let terminal: TerminalOutcome | null = null;

    if (!config.cursorApiKey) {
      throw new Error(
        "Cursor API key belum tersedia — simpan di panel Bridge credentials web app"
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

    if (shouldUseOrchestrator(platform, testCases)) {
      const hasMobileTc = testCases.some((tc) => tc.platform === "mobile");
      const hybridMobileConfig = resolveHybridMobileConfig(testCases, job.mobileConfig);
      let acquiredUdid: string | undefined;
      if (hasMobileTc) {
        acquiredUdid = await acquireCursorHybridDevice(job.id, hybridMobileConfig);
      }

      const mobileConfigForJob = (() => {
        const base = hybridMobileConfig ?? job.mobileConfig;
        if (!base) return undefined;
        if (!acquiredUdid) return base;
        return { ...base, udid: acquiredUdid };
      })();

      await executeMultiTestBridgeJob({
        job: {
          ...job,
          testCases,
          platform: "hybrid",
          mobileConfig: mobileConfigForJob,
        },
        testCases,
        emit,
        isCancelled: () => cancelled,
        startingMessage: agentMessages.startingCursor,
        cleanupMode: "cursor-subprocess",
        createRunner: () =>
          createCursorTestCaseRunner(
            job.id,
            modelId,
            acquiredUdid,
            mobileConfigForJob
          ),
      });
      return;
    }

    const promptInput = buildPromptForJob({
      platform: job.platform,
      mobileConfig: job.mobileConfig,
      channel: job.channel,
      text: job.text,
      strategy: job.strategy,
      attachments: job.attachments,
      visionAttachments,
      savedAttachments,
      promptBasePaths: job.promptBasePaths,
    });

    const sendMessage = buildCursorSdkMessage(promptInput);

    emit({
      type: "agent_job",
      id: job.id,
      channel: job.channel,
      status: "running",
      message: agentMessages.startingCursor,
      progress: 5,
    });

    let acquiredUdid: string | undefined;
    if ((platform === "mobile" || platform === "hybrid") && job.mobileConfig) {
      setMobileJobConfig(job.id, job.mobileConfig);
      acquiredUdid = await devicePool.acquire(job.id, job.mobileConfig.udid);
      setMobileJobUdid(job.id, acquiredUdid);
    }

    const agent = await Agent.create({
      apiKey: config.cursorApiKey,
      model: { id: modelId },
      local: {
        cwd: config.bridgeCwd,
        settingSources: [],
      },
      mcpServers: mcpServerConfig(job, acquiredUdid),
    });

    if (cancelled) {
      terminal = { kind: "cancelled" };
    } else {
      let runningEmitted = false;
      let lastTool = "";
      let lastScreenshot: string | undefined;

      const run = await agent.send(sendMessage, {
        model: { id: modelId },
        mcpServers: mcpServerConfig(job, acquiredUdid),
        onDelta: ({ update }) => {
          if (update.type === "tool-call-started" && !cancelled) {
            const tc = update.toolCall;
            const toolName = tc.type === "mcp" ? (tc.args.toolName ?? undefined) : undefined;
            if (toolName && toolName !== lastTool) {
              lastTool = toolName;
              runningEmitted = true;
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
          }
          if (update.type === "tool-call-completed" && !cancelled) {
            const tc = update.toolCall;
            if (tc.type === "mcp") {
              const toolName = tc.args.toolName ?? undefined;
              const output = "result" in tc ? (tc as { result?: unknown }).result : undefined;
              const screenshot = toolName ? extractScreenshotBase64(toolName, output) : undefined;
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
          }
        },
      });

      runCancel = async () => {
        await run.cancel();
      };

      if (cancelled) {
        await run.cancel().catch(() => undefined);
        terminal = { kind: "cancelled" };
      } else {
        const timeout = setTimeout(() => {
          if (!cancelled) {
            void run.cancel().catch(() => undefined);
          }
        }, config.jobTimeoutMs);

        try {
          logger.info(`Run started: ${run.id}`);

          for await (const _event of run.stream()) {
            if (cancelled) break;

            if (!runningEmitted) {
              runningEmitted = true;
              emit({
                type: "agent_job",
                id: job.id,
                channel: job.channel,
                status: "running",
                message: agentMessages.running,
                progress: 10,
              });
            }
          }

          if (cancelled) {
            terminal = { kind: "cancelled" };
          } else {
            const result = await run.wait();
            if (result.status === "error") {
              terminal = {
                kind: "error",
                message: agentMessages.agentRunFailed(result.id),
              };
            } else {
              const summary =
                typeof result.result === "string"
                  ? result.result
                  : JSON.stringify(result.result ?? agentMessages.doneFallback);

              lastScreenshot = await ensureJobScreenshot(null, lastScreenshot);
              terminal = { kind: "completed", result: summary };
            }
          }
        } catch (error) {
          if (cancelled) {
            terminal = { kind: "cancelled" };
          } else if (error instanceof CursorAgentError) {
            terminal = { kind: "error", message: error.message };
          } else {
            terminal = {
              kind: "error",
              message: error instanceof Error ? error.message : String(error),
            };
          }
        } finally {
          clearTimeout(timeout);
        }
      }
    }

    const dispose = agent[Symbol.asyncDispose];
    if (typeof dispose === "function") await dispose.call(agent);
    if (platform === "mobile") {
      await cleanupMobileJob(job.id);
    } else {
      const { closeAutomationBrowser } = await import("../../shared/mcp-browser.js");
      await closeAutomationBrowser();
    }
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

    await cleanupJobAttachments(job.id);
  })();

  return { promise, cancel };
}
