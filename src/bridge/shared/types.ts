export type AgentJobStatus =
  | "queued"
  | "running"
  | "completed"
  | "error"
  | "cancelled";

export type BridgeKind = "cursor" | "gemini" | "openrouter" | "ninerouter";

export interface BridgeModelOption {
  id: string;
  label: string;
  vision?: boolean;
}

export interface BridgeInfo {
  bridgeId: string;
  bridgeKind: BridgeKind;
  bridgeLabel: string;
  defaultModel: string;
  models: BridgeModelOption[];
  browserHeaded?: boolean;
}

export interface PromptAttachment {
  data: string;
  mimeType: string;
  name: string;
  kind: "image" | "file";
}

export interface UserPromptMessage {
  type: "user_prompt";
  id: string;
  channel: string;
  bridgeId: string;
  text: string;
  strategy?: string;
  model?: string;
  attachments?: PromptAttachment[];
}

export interface AgentJobCancelMessage {
  type: "agent_job_cancel";
  id: string;
  channel: string;
  bridgeId: string;
}

export interface AgentJobMessage {
  type: "agent_job";
  id: string;
  channel: string;
  bridgeId?: string;
  status: AgentJobStatus;
  message: string;
  progress?: number;
  result?: string;
  screenshotBase64?: string;
  toolName?: string;
}

export interface BridgeJob {
  id: string;
  channel: string;
  text: string;
  strategy?: string;
  model?: string;
  attachments?: PromptAttachment[];
}
