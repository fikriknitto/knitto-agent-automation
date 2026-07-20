import { Server, logger } from "./core/index.js";
import type { ToolDefinition } from "./core/types.js";
import { startSegmentStopPoller } from "../../core/evidence/segment-stop-poller.js";

export interface McpStdioConfig {
  name: string;
  version: string;
  platform: "browser" | "mobile";
  // Registry entries are heterogeneous ToolDefinition<TInput, TResult> instances.
  tools: readonly ToolDefinition<never, never>[];
  beforeStart?: () => Promise<void> | void;
  onShutdown?: () => Promise<void> | void;
}

export async function runMcpStdioServer(config: McpStdioConfig): Promise<void> {
  if (config.onShutdown) {
    const shutdown = async (): Promise<void> => {
      try {
        await config.onShutdown?.();
      } catch {
        // best-effort cleanup on signal
      }
    };
    process.once("SIGINT", () => {
      void shutdown().finally(() => process.exit(0));
    });
    process.once("SIGTERM", () => {
      void shutdown().finally(() => process.exit(0));
    });
  }

  await config.beforeStart?.();

  const server = new Server({ name: config.name, version: config.version });
  for (const tool of config.tools) {
    server.registerTool(tool as unknown as ToolDefinition);
  }

  startSegmentStopPoller(config.platform);

  await server.start();
}

export function reportFatalAndExit(err: unknown): void {
  logger.error(err instanceof Error ? err : String(err));
  process.exit(1);
}
