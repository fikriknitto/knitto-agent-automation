import { config as loadDotenv } from "dotenv";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "node:http";
import type { AgentJobMessage, BridgeKind } from "@knitto/shared";
import { createLogger } from "./automation/core/index.js";
import { createApp } from "./app.js";
import { loadEnv, resolveHttpHost, resolveHttpPort } from "./config/env.js";
import { BridgeRegistryService } from "./services/bridge-registry.service.js";
import { WsHub } from "./websocket/ws-hub.js";

const backendRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
loadDotenv({ path: join(backendRoot, ".env") });

const logger = createLogger("server");

async function main(): Promise<void> {
  const env = loadEnv();
  const host = resolveHttpHost(env);
  const port = resolveHttpPort(env);

  let wsHub: WsHub;

  const bridgeRegistry = new BridgeRegistryService(
    (msg: AgentJobMessage) => {
      wsHub.broadcastAgentJob(msg.channel, msg);
    },
    (bridgeId: string, bridgeKind: BridgeKind) => {
      wsHub.broadcastCredentialsRequest(bridgeId, bridgeKind);
    },
    (bridgeId: string, bridgeKind: BridgeKind, valid: boolean, message: string) => {
      wsHub.broadcastCredentialsStatus(bridgeId, bridgeKind, valid, message);
    },
    () => {
      wsHub.broadcastBridgeUpdates();
    }
  );

  const app = createApp(bridgeRegistry);
  const httpServer = createServer(app);

  wsHub = new WsHub(httpServer, bridgeRegistry);

  await new Promise<void>((resolve, reject) => {
    const onError = (error: NodeJS.ErrnoException) => {
      httpServer.off("listening", onListening);
      if (error.code === "EADDRINUSE") {
        reject(
          new Error(
            `Port ${port} sudah dipakai — ubah BACKEND_PORT di apps/backend/.env atau hentikan proses yang memakai port tersebut`
          )
        );
        return;
      }
      reject(error);
    };

    const onListening = () => {
      httpServer.off("error", onError);
      logger.info(`Backend listening on http://${host}:${port} (WS: /ws)`);
      resolve();
    };

    httpServer.once("error", onError);
    httpServer.once("listening", onListening);
    httpServer.listen(port, host);
  });

  try {
    await bridgeRegistry.startAll();
    wsHub.broadcastBridgeUpdates();
  } catch (error) {
    logger.error(
      `Bridge startup failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

main().catch((error) => {
  logger.error(error instanceof Error ? error : String(error));
  process.exit(1);
});
