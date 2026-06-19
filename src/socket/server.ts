#!/usr/bin/env node
import { randomBytes } from "node:crypto";
import { createServer } from "node:http";
import { createLogger } from "../mcp/core/index.js";
import { WebSocketServer, type WebSocket } from "ws";
import type { BridgeKind } from "../bridge/shared/types.js";

const logger = createLogger("automation-socket");

const port = Number(process.env.AUTOMATION_WS_PORT ?? "3077");
const host = process.env.AUTOMATION_WS_HOST ?? "0.0.0.0";

const BRIDGE_OFFLINE_MESSAGE =
  "AI bridge offline. Run pnpm run start:bridge, start:bridge:cursor, or start:bridge:ninerouter.";

const BRIDGE_NOT_FOUND_MESSAGE = "Selected bridge is offline or not found.";

const BRIDGE_LABELS: Record<BridgeKind, string> = {
  cursor: "Cursor",
  gemini: "Gemini",
  openrouter: "OpenRouter",
  ninerouter: "9Router",
};

type Role = "web";

type ClientMeta = {
  channel: string;
  role: Role;
  connectionId: string;
};

type BridgeModel = { id: string; label: string };

type BridgeEntry = {
  ws: WebSocket;
  bridgeId: string;
  bridgeKind: BridgeKind;
  bridgeLabel: string;
  defaultModel: string;
  models: BridgeModel[];
  browserHeaded?: boolean;
};

type BridgeSocketMeta = { isBridge: boolean; bridgeId?: string };

const channels = new Map<string, Set<WebSocket>>();
const socketMeta = new WeakMap<WebSocket, ClientMeta>();
const bridgeSocketMeta = new WeakMap<WebSocket, BridgeSocketMeta>();
const bridges = new Map<string, BridgeEntry>();

const AGENT_WEB_TYPES = new Set([
  "user_prompt",
  "agent_job_cancel",
  "refresh_status",
  "bridge_credentials",
]);

function createConnectionId(): string {
  return `web-${randomBytes(4).toString("hex")}`;
}

function normalizeBridgeKind(kind?: string): BridgeKind {
  if (kind === "gemini" || kind === "google") return "gemini";
  if (kind === "openrouter" || kind === "sca") return "openrouter";
  if (kind === "ninerouter" || kind === "9router") return "ninerouter";
  return "cursor";
}

function parseNinerouterCredentials(data: Record<string, unknown>): {
  baseUrl: string;
  apiKey: string;
} | null {
  const nested = data.ninerouter;
  if (!nested || typeof nested !== "object") return null;
  const record = nested as Record<string, unknown>;
  const baseUrl = typeof record.baseUrl === "string" ? record.baseUrl.trim() : "";
  if (!baseUrl) return null;
  return {
    baseUrl,
    apiKey: typeof record.apiKey === "string" ? record.apiKey.trim() : "",
  };
}

function createBridgeId(kind: BridgeKind): string {
  return `${kind}-${randomBytes(4).toString("hex")}`;
}

function isBridgeAvailable(): boolean {
  return bridges.size > 0;
}

function bridgeSummaries(): Array<{
  bridgeId: string;
  bridgeKind: BridgeKind;
  bridgeLabel: string;
}> {
  return [...bridges.values()].map((entry) => ({
    bridgeId: entry.bridgeId,
    bridgeKind: entry.bridgeKind,
    bridgeLabel: entry.bridgeLabel,
  }));
}

function bridgeSnapshotPayload(): Array<{
  bridgeId: string;
  bridgeKind: BridgeKind;
  bridgeLabel: string;
  defaultModel: string;
  models: BridgeModel[];
  browserHeaded?: boolean;
}> {
  return [...bridges.values()].map((entry) => ({
    bridgeId: entry.bridgeId,
    bridgeKind: entry.bridgeKind,
    bridgeLabel: entry.bridgeLabel,
    defaultModel: entry.defaultModel,
    models: entry.models,
    browserHeaded: entry.browserHeaded,
  }));
}

function bridgeCatalogSignature(defaultModel: string, models: BridgeModel[]): string {
  return `${defaultModel}|${models.map((m) => m.id).join(",")}`;
}

function getChannelClients(channel: string): Set<WebSocket> {
  let set = channels.get(channel);
  if (!set) {
    set = new Set();
    channels.set(channel, set);
  }
  return set;
}

function broadcastToWeb(channel: string, payload: unknown, except?: WebSocket): void {
  const raw = JSON.stringify(payload);
  for (const client of getChannelClients(channel)) {
    if (client !== except && client.readyState === client.OPEN) {
      client.send(raw);
    }
  }
}

function sendBridgeStatus(ws: WebSocket, channelName: string): void {
  if (ws.readyState !== ws.OPEN) return;
  ws.send(
    JSON.stringify({
      type: "bridge_status",
      available: isBridgeAvailable(),
      channel: channelName,
      bridges: bridgeSummaries(),
    })
  );
}

function sendBridgesSnapshot(ws: WebSocket, channelName: string): void {
  if (ws.readyState !== ws.OPEN) return;
  ws.send(
    JSON.stringify({
      type: "bridges_snapshot",
      channel: channelName,
      bridges: bridgeSnapshotPayload(),
    })
  );
}

function broadcastBridgeStatus(except?: WebSocket): void {
  for (const channel of channels.keys()) {
    broadcastToWeb(
      channel,
      {
        type: "bridge_status",
        available: isBridgeAvailable(),
        channel,
        bridges: bridgeSummaries(),
      },
      except
    );
  }
}

function broadcastBridgesSnapshot(except?: WebSocket): void {
  for (const channel of channels.keys()) {
    broadcastToWeb(
      channel,
      {
        type: "bridges_snapshot",
        channel,
        bridges: bridgeSnapshotPayload(),
      },
      except
    );
  }
}

function getBridgeEntry(bridgeId?: string): BridgeEntry | undefined {
  if (!bridgeId) return undefined;
  const entry = bridges.get(bridgeId);
  if (!entry || entry.ws.readyState !== entry.ws.OPEN) return undefined;
  return entry;
}

function findBridgeByKind(bridgeKind: BridgeKind): BridgeEntry | undefined {
  for (const entry of bridges.values()) {
    if (entry.bridgeKind === bridgeKind && entry.ws.readyState === entry.ws.OPEN) {
      return entry;
    }
  }
  return undefined;
}

function sendToBridge(bridgeId: string, payload: unknown): boolean {
  const entry = getBridgeEntry(bridgeId);
  if (!entry) return false;
  entry.ws.send(JSON.stringify(payload));
  return true;
}

function removeBridge(ws: WebSocket): void {
  const meta = bridgeSocketMeta.get(ws);
  const bridgeId = meta?.bridgeId;
  if (!bridgeId) return;
  bridges.delete(bridgeId);
  bridgeSocketMeta.set(ws, { isBridge: true });
}

function evictBridgesByKind(bridgeKind: BridgeKind, exceptWs?: WebSocket): void {
  for (const [bridgeId, entry] of bridges) {
    if (entry.bridgeKind !== bridgeKind) continue;
    if (entry.ws === exceptWs) continue;
    bridges.delete(bridgeId);
    if (entry.ws.readyState === entry.ws.OPEN) {
      entry.ws.close();
    }
  }
}

function removeClient(ws: WebSocket): void {
  const meta = socketMeta.get(ws);
  if (!meta) return;
  getChannelClients(meta.channel).delete(ws);
  if (getChannelClients(meta.channel).size === 0) {
    channels.delete(meta.channel);
  }
  socketMeta.delete(ws);
}

function handleAgentFromWeb(
  ws: WebSocket,
  meta: ClientMeta,
  data: Record<string, unknown>
): boolean {
  const channel = (data.channel as string) ?? meta.channel;

  if (data.type === "refresh_status") {
    sendBridgeStatus(ws, channel);
    sendBridgesSnapshot(ws, channel);
    return true;
  }

  if (data.type === "user_prompt") {
    if (!isBridgeAvailable()) {
      ws.send(
        JSON.stringify({
          type: "agent_job",
          id: data.id,
          channel,
          status: "error",
          message: BRIDGE_OFFLINE_MESSAGE,
          progress: 100,
        })
      );
      return true;
    }
    if (!data.bridgeId) {
      ws.send(
        JSON.stringify({
          type: "agent_job",
          id: data.id,
          channel,
          status: "error",
          message: "bridgeId is required",
          progress: 100,
        })
      );
      return true;
    }
    if (!sendToBridge(String(data.bridgeId), data)) {
      ws.send(
        JSON.stringify({
          type: "agent_job",
          id: data.id,
          channel,
          status: "error",
          message: BRIDGE_NOT_FOUND_MESSAGE,
          progress: 100,
        })
      );
    }
    return true;
  }

  if (data.type === "agent_job_cancel") {
    if (data.bridgeId) {
      sendToBridge(String(data.bridgeId), data);
    }
    return true;
  }

  if (data.type === "bridge_credentials") {
    const bridgeKind = normalizeBridgeKind(String(data.bridgeKind ?? ""));
    const target =
      getBridgeEntry(String(data.bridgeId ?? "")) ?? findBridgeByKind(bridgeKind);
    if (!target) return true;

    if (bridgeKind === "ninerouter") {
      const ninerouter = parseNinerouterCredentials(data);
      if (!ninerouter) return true;
      target.ws.send(
        JSON.stringify({
          type: "bridge_credentials",
          bridgeId: target.bridgeId,
          bridgeKind: target.bridgeKind,
          ninerouter,
        })
      );
      return true;
    }

    if (typeof data.apiKey !== "string" || !data.apiKey.trim()) {
      return true;
    }
    target.ws.send(
      JSON.stringify({
        type: "bridge_credentials",
        bridgeId: target.bridgeId,
        bridgeKind: target.bridgeKind,
        apiKey: data.apiKey.trim(),
      })
    );
    return true;
  }

  return false;
}

function handleConnection(ws: WebSocket): void {
  bridgeSocketMeta.set(ws, { isBridge: false });
  logger.info("Client connected");

  ws.on("message", (raw) => {
    try {
      const data = JSON.parse(String(raw)) as Record<string, unknown>;

      if (data.type === "bridge_register" || data.clientRole === "bridge") {
        const bridgeKind = normalizeBridgeKind(String(data.bridgeKind ?? ""));
        const bridgeLabel =
          (typeof data.bridgeLabel === "string" && data.bridgeLabel.trim()) ||
          BRIDGE_LABELS[bridgeKind];
        const existingMeta = bridgeSocketMeta.get(ws);

        if (existingMeta?.isBridge && existingMeta.bridgeId) {
          const existing = bridges.get(existingMeta.bridgeId);
          if (existing?.ws === ws) {
            ws.send(
              JSON.stringify({
                type: "bridge_registered",
                bridgeId: existing.bridgeId,
                bridgeKind: existing.bridgeKind,
                bridgeLabel: existing.bridgeLabel,
              })
            );
            return;
          }
        }

        evictBridgesByKind(bridgeKind, ws);
        const bridgeId = createBridgeId(bridgeKind);
        bridgeSocketMeta.set(ws, { isBridge: true, bridgeId });
        bridges.set(bridgeId, {
          ws,
          bridgeId,
          bridgeKind,
          bridgeLabel,
          defaultModel: "",
          models: [],
        });

        ws.send(
          JSON.stringify({
            type: "bridge_registered",
            bridgeId,
            bridgeKind,
            bridgeLabel,
          })
        );
        logger.info(`Bridge registered: ${bridgeId} (${bridgeLabel})`);
        broadcastBridgeStatus(ws);
        broadcastBridgesSnapshot(ws);
        return;
      }

      if (data.type === "bridge_config") {
        const isBridge = bridgeSocketMeta.get(ws)?.isBridge ?? false;
        if (!isBridge) return;
        const bridgeId = (data.bridgeId as string) ?? bridgeSocketMeta.get(ws)?.bridgeId;
        if (!bridgeId || !data.defaultModel || !Array.isArray(data.models)) return;
        const entry = bridges.get(bridgeId);
        if (!entry || entry.ws !== ws) return;
        const bridgeKind = normalizeBridgeKind(String(data.bridgeKind ?? entry.bridgeKind));
        entry.bridgeKind = bridgeKind;
        entry.bridgeLabel =
          (typeof data.bridgeLabel === "string" && data.bridgeLabel.trim()) ||
          BRIDGE_LABELS[bridgeKind];
        const nextDefaultModel = String(data.defaultModel);
        const nextModels = data.models as BridgeModel[];
        const catalogChanged =
          bridgeCatalogSignature(entry.defaultModel, entry.models) !==
          bridgeCatalogSignature(nextDefaultModel, nextModels);
        entry.defaultModel = nextDefaultModel;
        entry.models = nextModels;
        if (typeof data.browserHeaded === "boolean") {
          entry.browserHeaded = data.browserHeaded;
        }
        if (catalogChanged) {
          broadcastBridgesSnapshot(ws);
        }
        return;
      }

      if (data.type === "bridge_credentials_request") {
        const isBridge = bridgeSocketMeta.get(ws)?.isBridge ?? false;
        if (!isBridge) return;
        const bridgeId = (data.bridgeId as string) ?? bridgeSocketMeta.get(ws)?.bridgeId;
        const bridgeKind = normalizeBridgeKind(String(data.bridgeKind ?? ""));
        if (!bridgeId) return;
        for (const channel of channels.keys()) {
          broadcastToWeb(
            channel,
            {
              type: "bridge_credentials_request",
              bridgeId,
              bridgeKind,
              channel,
            },
            ws
          );
        }
        return;
      }

      if (data.type === "bridge_credentials_status") {
        const isBridge = bridgeSocketMeta.get(ws)?.isBridge ?? false;
        if (!isBridge) return;
        const bridgeId = (data.bridgeId as string) ?? bridgeSocketMeta.get(ws)?.bridgeId;
        const bridgeKind = normalizeBridgeKind(String(data.bridgeKind ?? ""));
        if (!bridgeId) return;
        for (const channel of channels.keys()) {
          broadcastToWeb(
            channel,
            {
              type: "bridge_credentials_status",
              bridgeId,
              bridgeKind,
              valid: data.valid === true,
              message: typeof data.message === "string" ? data.message : "",
              channel,
            },
            ws
          );
        }
        return;
      }

      if (data.type === "agent_job") {
        const channel = data.channel as string;
        if (!channel) return;
        const bridgeId = (data.bridgeId as string) ?? bridgeSocketMeta.get(ws)?.bridgeId;
        broadcastToWeb(channel, { ...data, bridgeId }, ws);
        return;
      }

      if (data.type === "join") {
        const channel = (data.channel as string)?.trim();
        if (!channel) {
          ws.send(JSON.stringify({ type: "error", message: "join requires channel" }));
          return;
        }

        const connectionId = createConnectionId();
        socketMeta.set(ws, { channel, role: "web", connectionId });
        getChannelClients(channel).add(ws);

        ws.send(
          JSON.stringify({
            type: "joined",
            channel,
            role: "web",
            connectionId,
          })
        );

        sendBridgeStatus(ws, channel);
        sendBridgesSnapshot(ws, channel);
        logger.info(`Client joined channel=${channel}`);
        return;
      }

      const meta = socketMeta.get(ws);
      if (!meta) {
        ws.send(JSON.stringify({ type: "error", message: "Join a channel first" }));
        return;
      }

      if (AGENT_WEB_TYPES.has(String(data.type))) {
        handleAgentFromWeb(ws, meta, data);
      }
    } catch (error) {
      logger.error(`Message error: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  ws.on("close", () => {
    const wasBridge = bridgeSocketMeta.get(ws)?.isBridge ?? false;
    if (wasBridge) {
      removeBridge(ws);
      broadcastBridgeStatus();
      broadcastBridgesSnapshot();
    }
    removeClient(ws);
    logger.info("Client disconnected");
  });

  ws.on("error", (error) => {
    logger.error(`Socket error: ${error}`);
    removeClient(ws);
  });
}

const httpServer = createServer((_req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("knitto-mcp-automation-socket\n");
});

const wss = new WebSocketServer({ server: httpServer });

wss.on("connection", handleConnection);

httpServer.listen(port, host, () => {
  logger.info(`Automation socket relay listening on ws://${host}:${port}`);
});
