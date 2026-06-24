import type { AgentJobMessage, BridgeInfo } from "@knitto/shared";

export type ConnectionState = "disconnected" | "connecting" | "connected" | "error";

export type BridgeSummary = BridgeInfo;

export type { AgentJobMessage };

export type ChatLine = {
  id: string;
  role: "user" | "agent" | "system";
  text: string;
  status?: AgentJobMessage["status"];
  progress?: number;
  result?: string;
  screenshots?: string[];
  toolName?: string;
};
