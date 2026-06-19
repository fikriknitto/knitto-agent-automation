import WebSocket from "ws";
import { createLogger } from "../../mcp/core/index.js";
import { browserHeadedFromEnv } from "../shared/browser-env.js";
import { requestBridgeCredentials } from "../shared/credentials.js";
import type { AgentJobCancelMessage, AgentJobMessage, UserPromptMessage } from "../shared/types.js";
import config, { setCursorApiKey } from "./config.js";
import type { ModelCatalog } from "./model-catalog.js";
import { fallbackModelCatalog, fetchModelCatalog, validateCursorApiKey } from "./model-catalog.js";

const logger = createLogger("bridge-cursor-ws");

export type BridgeMessageHandler = {
  onUserPrompt: (msg: UserPromptMessage) => void;
  onJobCancel: (msg: AgentJobCancelMessage) => void;
};

function catalogSignature(catalog: ModelCatalog): string {
  return `${catalog.defaultModel}|${catalog.models.map((m) => m.id).join(",")}`;
}

export class BridgeWsClient {
  private ws: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private bridgeId: string | null = null;
  private readyPromise: Promise<void> | null = null;
  private resolveReady: (() => void) | null = null;
  private lastAppliedApiKey: string | null = null;
  private lastConfigSignature: string | null = null;

  constructor(private readonly handlers: BridgeMessageHandler) {}

  whenReady(): Promise<void> {
    if (!this.readyPromise) {
      this.readyPromise = new Promise((resolve) => {
        this.resolveReady = resolve;
      });
    }
    return this.readyPromise;
  }

  connect(): void {
    const state = this.ws?.readyState;
    if (state === WebSocket.OPEN || state === WebSocket.CONNECTING) return;

    logger.info(`Connecting to ${config.wsUrl}`);
    this.ws = new WebSocket(config.wsUrl);

    this.ws.on("open", () => {
      logger.info("Connected to socket server");
      this.bridgeId = null;
      this.lastAppliedApiKey = null;
      this.lastConfigSignature = null;
      this.readyPromise = null;
      this.resolveReady = null;
      this.ws?.send(
        JSON.stringify({
          type: "bridge_register",
          clientRole: "bridge",
          bridgeKind: "cursor",
          bridgeLabel: "Cursor",
        })
      );
    });

    this.ws.on("message", (raw) => {
      try {
        const data = JSON.parse(String(raw)) as Record<string, unknown>;
        if (data.type === "bridge_registered" && typeof data.bridgeId === "string") {
          void this.onRegistered(data.bridgeId);
        } else if (data.type === "bridge_credentials") {
          this.onBridgeCredentials(data);
        } else if (data.type === "user_prompt") {
          this.handlers.onUserPrompt(data as unknown as UserPromptMessage);
        } else if (data.type === "agent_job_cancel") {
          this.handlers.onJobCancel(data as unknown as AgentJobCancelMessage);
        }
      } catch (error) {
        logger.error(error instanceof Error ? error.message : String(error));
      }
    });

    this.ws.on("close", () => {
      logger.info("Disconnected from socket server; reconnecting in 2s");
      this.scheduleReconnect();
    });

    this.ws.on("error", (err) => {
      logger.error(String(err));
    });
  }

  emitJob(msg: AgentJobMessage): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      logger.warn("Cannot emit agent_job: socket not connected");
      return;
    }
    this.ws.send(
      JSON.stringify({
        ...msg,
        bridgeId: this.bridgeId ?? msg.bridgeId,
      })
    );
  }

  private async onRegistered(bridgeId: string): Promise<void> {
    this.bridgeId = bridgeId;

    if (config.cursorApiKey) {
      await this.applyCredentials(config.cursorApiKey);
    } else if (this.ws) {
      requestBridgeCredentials(this.ws, bridgeId, "cursor");
      this.emitBridgeConfig(fallbackModelCatalog(config.modelId));
    }

    this.resolveReady?.();
    this.resolveReady = null;
  }

  private onBridgeCredentials(data: Record<string, unknown>): void {
    const bridgeId = typeof data.bridgeId === "string" ? data.bridgeId : null;
    if (bridgeId && bridgeId !== this.bridgeId) return;

    const apiKey = typeof data.apiKey === "string" ? data.apiKey.trim() : "";
    if (!apiKey) return;

    void this.applyCredentials(apiKey);
  }

  private async applyCredentials(apiKey: string): Promise<void> {
    if (apiKey === this.lastAppliedApiKey && config.cursorApiKey === apiKey) {
      return;
    }

    const { valid, message } = await validateCursorApiKey(apiKey);

    if (valid) {
      setCursorApiKey(apiKey);
      this.lastAppliedApiKey = apiKey;
      logger.info("Cursor API key verified");
      await this.publishBridgeConfig();
    } else {
      setCursorApiKey("");
      this.lastAppliedApiKey = null;
      logger.warn(`Cursor API key rejected: ${message}`);
      this.emitBridgeConfig(fallbackModelCatalog(config.modelId));
    }

    this.emitCredentialsStatus(valid, message);
  }

  private emitCredentialsStatus(valid: boolean, message: string): void {
    if (!this.bridgeId || !this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(
      JSON.stringify({
        type: "bridge_credentials_status",
        bridgeId: this.bridgeId,
        bridgeKind: "cursor",
        valid,
        message,
      })
    );
  }

  private async publishBridgeConfig(): Promise<void> {
    if (!this.bridgeId) return;
    this.emitBridgeConfig(fallbackModelCatalog(config.modelId));
    if (!config.cursorApiKey) return;
    try {
      const catalog = await fetchModelCatalog(config.cursorApiKey);
      this.emitBridgeConfig(catalog);
    } catch (error) {
      logger.warn(
        `Cursor model catalog fetch failed; using fallback: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  private emitBridgeConfig(catalog: ModelCatalog): void {
    if (!this.bridgeId || !this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    const signature = catalogSignature(catalog);
    if (signature === this.lastConfigSignature) return;
    this.lastConfigSignature = signature;

    this.ws.send(
      JSON.stringify({
        type: "bridge_config",
        bridgeId: this.bridgeId,
        bridgeKind: "cursor",
        bridgeLabel: "Cursor",
        defaultModel: catalog.defaultModel,
        models: catalog.models,
        browserHeaded: browserHeadedFromEnv(),
      })
    );
    logger.info(`Published bridge_config (${catalog.models.length} models)`);
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (this.ws) {
        this.ws.removeAllListeners();
        if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
          this.ws.close();
        }
        this.ws = null;
      }
      this.connect();
    }, 2000);
  }
}
