export type BridgeKind = "cursor" | "gemini" | "openrouter" | "ninerouter";

export type BridgeSummary = {
  bridgeId: string;
  bridgeKind: BridgeKind;
  bridgeLabel: string;
  defaultModel?: string;
  models?: Array<{ id: string; label: string; vision?: boolean }>;
  browserHeaded?: boolean;
};

export type ChatLine = {
  id: string;
  role: "user" | "agent" | "system";
  text: string;
  status?: string;
  screenshotBase64?: string;
  toolName?: string;
};

export type ConnectionState = "disconnected" | "connecting" | "connected" | "error";

export type AgentJobMessage = {
  type: "agent_job";
  id: string;
  channel: string;
  bridgeId?: string;
  status: "queued" | "running" | "completed" | "error" | "cancelled";
  message: string;
  progress?: number;
  result?: string;
  screenshotBase64?: string;
  toolName?: string;
};
