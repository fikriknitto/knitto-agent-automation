#!/usr/bin/env node
import { createLogger, logger } from "../mcp/core/index.js";
import { startBridgeJob } from "./ninerouter/agent-runner.js";
import config from "./ninerouter/config.js";
import { BridgeWsClient } from "./ninerouter/ws-client.js";
import { JobQueue } from "./shared/queue.js";

const log = createLogger("bridge-ninerouter");

async function main(): Promise<void> {
  log.info(`Bridge-ninerouter starting (MCP: ${config.automationMcpPath})`);

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

  const creds = config.ninerouterCredentials;
  if (!creds.baseUrl.trim()) {
    log.info("No NINEROUTER_BASE_URL in env — waiting for credentials from web app panel");
  }

  process.on("SIGINT", () => process.exit(0));
  process.on("SIGTERM", () => process.exit(0));
}

main().catch((err) => {
  logger.error(err instanceof Error ? err : String(err));
  process.exit(1);
});
