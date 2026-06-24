import { Agent, CursorAgentError } from "@cursor/sdk";
import { createLogger } from "../../../automation/core/index.js";
import { resolveMonorepoRoot } from "../../../config/paths.js";
import { automationMcpEnv, automationMcpSpawnArgs } from "../../shared/automation-mcp-config.js";
import { buildAgentPrompt, buildCursorSdkMessage } from "../../shared/prompt-builder.js";
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

const logger = createLogger("bridge-cursor");

export type JobProgressEmitter = (msg: AgentJobMessage) => void;

export interface BridgeJobHandle {
  promise: Promise<void>;
  cancel: () => Promise<void>;
}

function mcpServerConfig(jobId: string) {
  const env = automationMcpEnv(jobId);
  const filtered = Object.fromEntries(Object.entries(env).filter(([, v]) => v));
  const spawn = automationMcpSpawnArgs({
    command: config.automationMcpCommand,
    mcpPath: config.automationMcpPath,
  });
  return {
    automation: {
      command: spawn.command,
      args: spawn.args,
      env: filtered,
      cwd: resolveMonorepoRoot(),
    },
  };
}

export function startBridgeJob(job: BridgeJob, emit: JobProgressEmitter): BridgeJobHandle {
  let runCancel: (() => Promise<void>) | null = null;
  let cancelled = false;

  const cancel = async (): Promise<void> => {
    cancelled = true;
    if (runCancel) await runCancel();
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
    if (!config.cursorApiKey) {
      throw new Error(
        "Cursor API key belum tersedia — simpan di panel Bridge credentials web app"
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
    const sendMessage = buildCursorSdkMessage(promptInput);

    emit({
      type: "agent_job",
      id: job.id,
      channel: job.channel,
      status: "running",
      message: agentMessages.startingCursor,
      progress: 5,
    });

    const agent = await Agent.create({
      apiKey: config.cursorApiKey,
      model: { id: modelId },
      local: {
        cwd: config.bridgeCwd,
        settingSources: [],
      },
      mcpServers: mcpServerConfig(job.id),
    });

    if (cancelled) {
      emitCancelled();
      return;
    }

    let runningEmitted = false;
    let lastTool = "";
    let lastScreenshot: string | undefined;

    const run = await agent.send(sendMessage, {
      model: { id: modelId },
      mcpServers: mcpServerConfig(job.id),
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
                ...jobScreenshotPayload(job.id),
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
      emitCancelled();
      return;
    }

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
        emitCancelled();
        return;
      }

      const result = await run.wait();
      if (result.status === "error") {
        emit({
          type: "agent_job",
          id: job.id,
          channel: job.channel,
          status: "error",
          message: agentMessages.agentRunFailed(result.id),
          progress: 100,
        });
        return;
      }

      const summary =
        typeof result.result === "string"
          ? result.result
          : JSON.stringify(result.result ?? agentMessages.doneFallback);

      lastScreenshot = await ensureJobScreenshot(null, lastScreenshot);

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
      if (cancelled) {
        emitCancelled();
      } else if (error instanceof CursorAgentError) {
        emit({
          type: "agent_job",
          id: job.id,
          channel: job.channel,
          status: "error",
          message: error.message,
          progress: 100,
        });
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
      const dispose = agent[Symbol.asyncDispose];
      if (typeof dispose === "function") await dispose.call(agent);
      await closeAutomationBrowser();
      await cleanupJobAttachments(job.id);
    }
  })();

  return { promise, cancel };
}
