import type { AgentJobMessage, BridgeInfo } from "@knitto/shared";
import type { PromptAttachment } from "@knitto/shared";
import type { ChatPromptBase } from "./prompt-compose";

export type ConnectionState = "disconnected" | "connecting" | "connected" | "error";

export type BridgeSummary = BridgeInfo;

export type { AgentJobMessage };

export type ChatLine = {
  id: string;
  role: "user" | "agent" | "system";
  text: string;
  attachments?: PromptAttachment[];
  promptBases?: ChatPromptBase[];
  status?: AgentJobMessage["status"];
  progress?: number;
  result?: string;
  screenshots?: string[];
  videoUrl?: string;
  toolName?: string;
};
