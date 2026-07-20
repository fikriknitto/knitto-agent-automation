import { Agent, CursorAgentError } from "@cursor/sdk";
import { createLogger } from "../../platforms/browser/core/index.js";
import { resolveMonorepoRoot } from "../../config/paths.js";
import {
  automationMcpSpawnArgs,
  cursorMcpServerConfig,
  resolveMcpPathForJob,
} from "../../core/mcp/automation-mcp-config.js";
import { buildCursorSdkMessage, buildPromptForJob } from "../../core/prompts/prompt-builder.js";
import { resolveMemoryAppIdForJob } from "../../services/shared/resolve-memory-app-id-for-job.js";
import {
  cleanupJobAttachments,
  loadVisionAttachments,
  resolveJobAttachments,
} from "../../core/evidence/persist-attachments.js";
import { ensureJobScreenshot, extractScreenshotBase64 } from "../../core/evidence/tool-screenshot.js";
import { jobMediaPayload, jobMediaPayloadAsync } from "../../core/evidence/job-media-payload.js";
import { agentMessages } from "../../core/orchestration/agent-messages.js";
import { releaseBrowserLock } from "../../core/evidence/browser-lock.js";
import { logAgentRunEvent } from "../../core/orchestration/run-event-log.js";
import { devicePool } from "../../platforms/mobile/driver/device-pool.js";
import { cleanupMobileJob } from "../../core/orchestration/mobile-job-cleanup.js";
import {
  setMobileJobConfig,
  setMobileJobUdid,
} from "../../platforms/mobile/session/mobile-job-context.js";
import {
  resolveHybridMobileConfig,
  resolveJobTestCasesAsync,
  shouldUseOrchestrator,
} from "../../core/orchestration/test-case-parser.js";
import { executeMultiTestBridgeJob } from "../../core/orchestration/multi-test-bridge.js";
import {
  acquireCursorHybridDevice,
  createCursorTestCaseRunner,
} from "../../core/orchestration/multi-test-cursor.js";
import type { AgentJobMessage, BridgeJob } from "@knitto/shared";
import config from "./config.js";

const logger = createLogger("cursor-agent");

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
    apiDataToken: job.apiDataToken,
  });
}

async function cleanupCursorJobResources(
  job: BridgeJob,
  platform: string,
  agent: { [Symbol.asyncDispose]?: () => PromiseLike<void> } | null,
  acquiredDevice: boolean
): Promise<void> {
  if (agent) {
    const dispose = agent[Symbol.asyncDispose];
    if (typeof dispose === "function") {
      await Promise.resolve(dispose.call(agent)).catch(() => undefined);
    }
  }

  if (platform === "mobile" || platform === "hybrid") {
    await cleanupMobileJob(job.id).catch(() => undefined);
    if (acquiredDevice) {
      devicePool.release(job.id);
    }
  } else {
    const { closeAutomationBrowser } = await import("../../core/mcp/mcp-browser.js");
    await closeAutomationBrowser().catch(() => undefined);
    releaseBrowserLock(job.id);
  }

  await cleanupJobAttachments(job.id).catch(() => undefined);
}

export function startBridgeJob(job: BridgeJob, emit: JobProgressEmitter): BridgeJobHandle {
  let runCancel: (() => Promise<void>) | null = null;
  let cancelled = false;
  const jobLog = logger.child({ agentJobId: job.id, runId: job.runId });

  const cancel = async (): Promise<void> => {
    cancelled = true;
    if (runCancel) await runCancel();
  };

  const promise = (async () => {
    let terminal: TerminalOutcome | null = null;
    let agent: Awaited<ReturnType<typeof Agent.create>> | null = null;
    let acquiredDevice = false;
    const platform = job.platform ?? "browser";

    try {
      if (!config.cursorApiKey) {
        throw new Error(
          "Cursor API key belum tersedia — simpan di panel Agent credentials"
        );
      }

      const attachOpts = { apiDataToken: job.apiDataToken, jobId: job.id };
      const savedAttachments = await resolveJobAttachments(job.attachments, attachOpts);
      const visionAttachments = await loadVisionAttachments(job.attachments, attachOpts);
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
          acquiredDevice = true;
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
              mobileConfigForJob,
              job.apiDataToken
            ),
        });
        // Multi-TC path emits its own terminal status + cleanup via cleanupMode.
        acquiredDevice = false;
        return;
      }

      const memoryAppId = await resolveMemoryAppIdForJob({
        platform: job.platform,
        text: job.text,
        mobileConfig: job.mobileConfig,
        promptBasePaths: job.promptBasePaths,
        apiDataToken: job.apiDataToken,
      });
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
        memoryAppId,
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
        acquiredDevice = true;
        setMobileJobUdid(job.id, acquiredUdid);
      }

      agent = await Agent.create({
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
            jobLog.info(`Run started: ${run.id}`);

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
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      jobLog.error(message);
      terminal = { kind: "error", message };
      emit({
        type: "agent_job",
        id: job.id,
        channel: job.channel,
        status: "error",
        message,
        progress: 100,
      });
      void logAgentRunEvent({
        agentJobId: job.id,
        runId: job.runId,
        apiDataToken: job.apiDataToken,
        level: "ERROR",
        message: `Job error: ${message}`,
      });
    } finally {
      await cleanupCursorJobResources(job, platform, agent, acquiredDevice);
    }
  })();

  return { promise, cancel };
}
