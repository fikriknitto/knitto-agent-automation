#!/usr/bin/env node
import { createLogger, logger } from "../mcp/core/index.js";
import { startBridgeJob } from "./gemini/agent-runner.js";
import config from "./gemini/config.js";
import { BridgeWsClient } from "./gemini/ws-client.js";
import { JobQueue } from "./shared/queue.js";

const log = createLogger("bridge-gemini");

async function main(): Promise<void> {
  log.info(`Bridge-gemini starting (MCP: ${config.automationMcpPath})`);

  let wsClient: BridgeWsClient;

  const queue = new JobQueue(
    (msg) => wsClient.emitJob(msg),
    config.maxConcurrentPerChannel,
    startBridgeJob
  );

  wsClient = new BridgeWsClient({
    onUserPrompt: (msg) => queue.enqueueFromMessage(msg),
    onJobCancel: (msg) => {
      void queue.cancel(msg.id, msg.channel);
    },
  });

  wsClient.connect();
  await wsClient.whenReady();

  if (!config.geminiApiKey) {
    log.info("No GEMINI_API_KEY in env — waiting for API key from web app credentials panel");
  }

  process.on("SIGINT", () => process.exit(0));
  process.on("SIGTERM", () => process.exit(0));
}

main().catch((err) => {
  logger.error(err instanceof Error ? err : String(err));
  process.exit(1);
});
