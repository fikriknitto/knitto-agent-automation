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
import { jobMediaPayload, jobMediaPayloadAsync } from "../../shared/job-media-payload.js";
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

type TerminalOutcome =
  | { kind: "completed"; result: string }
  | { kind: "cancelled" }
  | { kind: "error"; message: string };

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

  const promise = (async () => {
    let terminal: TerminalOutcome | null = null;

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
      promptBasePaths: job.promptBasePaths,
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
      terminal = { kind: "cancelled" };
    } else {
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
    await closeAutomationBrowser();
    const media = await jobMediaPayloadAsync(job.id);

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
