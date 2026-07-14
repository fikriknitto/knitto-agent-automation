import type { AutomationPlatform, MobileConfig } from "@knitto/shared";
import { resolveWsUrl } from "./api-client";
import { isTerminalJobStatus } from "./active-jobs";
import type { AgentJobMessage, BridgeSummary, ConnectionState } from "./types";

export type WsClientCallbacks = {
  onConnectionState: (state: ConnectionState) => void;
  onBridges: (bridges: BridgeSummary[]) => void;
  onBridgeAvailable: (available: boolean) => void;
  onAgentJob: (msg: AgentJobMessage) => void;
  onCredentialsRequest: (payload: {
    bridgeId: string;
    bridgeKind: string;
  }) => void;
  onCredentialsStatus: (payload: {
    bridgeId: string;
    bridgeKind: string;
    valid: boolean;
    message: string;
  }) => void;
};
export class AutomationWsClient {
  private socket: WebSocket | null = null;
  private channel = "";
  private connectionId = "";
  private readonly submittedJobIds = new Set<string>();

  constructor(private readonly callbacks: WsClientCallbacks) {}

  clearSubmittedJob(jobId: string, status: AgentJobMessage["status"]): void {
    if (isTerminalJobStatus(status)) {
      this.submittedJobIds.delete(jobId);
    }
  }

  connect(host: string, port: string, channel: string, useWss = false): void {
    this.disconnect();
    this.channel = channel;
    this.callbacks.onConnectionState("connecting");

    const url = resolveWsUrl(host, port, useWss);
    this.socket = new WebSocket(url);

    this.socket.onopen = () => {
      this.socket?.send(
        JSON.stringify({
          type: "join",
          channel: channel.trim(),
        })
      );
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(String(event.data)) as Record<string, unknown>;
        this.handleMessage(data);
      } catch {
        // ignore
      }
    };

    this.socket.onclose = () => {
      this.callbacks.onConnectionState("disconnected");
    };

    this.socket.onerror = () => {
      this.callbacks.onConnectionState("error");
    };
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.connectionId = "";
    this.callbacks.onConnectionState("disconnected");
  }

  refreshStatus(): void {
    this.send({ type: "refresh_status", channel: this.channel });
  }

  sendUserPrompt(payload: {
    id: string;
    bridgeId: string;
    text: string;
    strategy: string;
    model: string;
    promptBasePaths?: string[];
    mainPrompt?: string;
    platform?: AutomationPlatform;
    mobileConfig?: MobileConfig;
    attachments?: Array<{
      storagePath: string;
      mimeType: string;
      name: string;
      kind: "image" | "file";
    }>;
  }): void {
    this.submittedJobIds.add(payload.id);
    this.send({
      type: "user_prompt",
      id: payload.id,
      channel: this.channel,
      bridgeId: payload.bridgeId,
      text: payload.text,
      strategy: payload.strategy,
      model: payload.model,
      ...(payload.promptBasePaths?.length ? { promptBasePaths: payload.promptBasePaths } : {}),
      ...(payload.mainPrompt ? { mainPrompt: payload.mainPrompt } : {}),
      ...(payload.platform ? { platform: payload.platform } : {}),
      ...(payload.mobileConfig ? { mobileConfig: payload.mobileConfig } : {}),
      ...(payload.attachments?.length ? { attachments: payload.attachments } : {}),
    });
  }

  sendCredentials(
    payload:
      | { bridgeId: string; bridgeKind: "cursor" | "gemini" | "openrouter"; apiKey: string }
      | {
          bridgeId: string;
          bridgeKind: "ninerouter";
          nineRouter: { baseUrl: string; apiKey: string };
        }
  ): void {
    if (payload.bridgeKind === "ninerouter") {
      this.send({
        type: "bridge_credentials",
        channel: this.channel,
        bridgeId: payload.bridgeId,
        bridgeKind: payload.bridgeKind,
        ninerouter: payload.nineRouter,
      });
      return;
    }

    this.send({
      type: "bridge_credentials",
      channel: this.channel,
      bridgeId: payload.bridgeId,
      bridgeKind: payload.bridgeKind,
      apiKey: payload.apiKey,
    });
  }

  cancelJob(payload: { id: string; bridgeId: string }): void {
    this.send({
      type: "agent_job_cancel",
      id: payload.id,
      channel: this.channel,
      bridgeId: payload.bridgeId,
    });
  }

  private send(payload: Record<string, unknown>): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;
    this.socket.send(JSON.stringify(payload));
  }

  private handleMessage(data: Record<string, unknown>): void {
    switch (data.type) {
      case "joined":
      case "system":
        if (typeof data.connectionId === "string") {
          this.connectionId = data.connectionId;
        }
        this.callbacks.onConnectionState("connected");
        this.refreshStatus();
        break;
      case "bridges_snapshot":
        this.callbacks.onBridges((data.bridges as BridgeSummary[]) ?? []);
        break;
      case "bridge_status":
        this.callbacks.onBridgeAvailable(data.available === true);
        if (Array.isArray(data.bridges)) {
          this.callbacks.onBridges(data.bridges as BridgeSummary[]);
        }
        break;
      case "agent_job": {
        const msg = data as unknown as AgentJobMessage;
        const ownsJob = this.submittedJobIds.has(msg.id);
        const sameConnection =
          !msg.connectionId || !this.connectionId || msg.connectionId === this.connectionId;
        if (!ownsJob && !sameConnection) {
          break;
        }
        this.callbacks.onAgentJob(msg);
        break;
      }
      case "bridge_credentials_request":
        this.callbacks.onCredentialsRequest({
          bridgeId: String(data.bridgeId ?? ""),
          bridgeKind: String(data.bridgeKind ?? ""),
        });
        break;
      case "bridge_credentials_status":
        this.callbacks.onCredentialsStatus({
          bridgeId: String(data.bridgeId ?? ""),
          bridgeKind: String(data.bridgeKind ?? ""),
          valid: data.valid === true,
          message: String(data.message ?? ""),
        });
        break;
      case "error":
        this.callbacks.onConnectionState("error");
        break;
      default:
        break;
    }
  }
}
