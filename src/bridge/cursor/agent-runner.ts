import { Agent, CursorAgentError } from "@cursor/sdk";
import { createLogger } from "../../mcp/core/index.js";
import { automationMcpEnv, automationMcpSpawnArgs } from "../shared/automation-mcp-config.js";
import { buildAgentPrompt, buildCursorSdkMessage } from "../shared/prompt-builder.js";
import { ensureJobScreenshot, extractScreenshotBase64 } from "../shared/tool-screenshot.js";
import { closeAutomationBrowser } from "../shared/mcp-browser.js";
import type { AgentJobMessage, BridgeJob } from "../shared/types.js";
import config from "./config.js";

const logger = createLogger("bridge-cursor");

export type JobProgressEmitter = (msg: AgentJobMessage) => void;

export interface BridgeJobHandle {
  promise: Promise<void>;
  cancel: () => Promise<void>;
}

function mcpServerConfig() {
  const env = automationMcpEnv();
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
      message: "Cancelled",
    });
  };

  const promise = (async () => {
    if (!config.cursorApiKey) {
      throw new Error(
        "Cursor API key belum tersedia — simpan di panel Bridge credentials web app"
      );
    }

    const promptInput = buildAgentPrompt({
      channel: job.channel,
      text: job.text,
      strategy: job.strategy,
      images: job.images,
    });

    const modelId = job.model ?? config.modelId;
    const sendMessage = buildCursorSdkMessage(promptInput);

    emit({
      type: "agent_job",
      id: job.id,
      channel: job.channel,
      status: "running",
      message: "Starting Cursor agent…",
      progress: 5,
    });

    const agent = await Agent.create({
      apiKey: config.cursorApiKey,
      model: { id: modelId },
      local: {
        cwd: config.bridgeCwd,
        settingSources: [],
      },
      mcpServers: mcpServerConfig(),
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
      mcpServers: mcpServerConfig(),
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
              message: `Using ${toolName}…`,
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
                message: "Screenshot captured",
                progress: 50,
                screenshotBase64: screenshot,
                toolName,
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
            message: "Running…",
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
          message: `Agent run failed (${result.id})`,
          progress: 100,
        });
        return;
      }

      const summary =
        typeof result.result === "string"
          ? result.result
          : JSON.stringify(result.result ?? "Done");

      lastScreenshot = await ensureJobScreenshot(null, lastScreenshot);

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
    }
  })();

  return { promise, cancel };
}
