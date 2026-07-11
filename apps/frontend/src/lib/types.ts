import type { AgentJobMessage, BridgeInfo, TestCaseResult } from "@knitto/shared";
import type { PromptAttachment } from "@knitto/shared";
import type { AutomationPlatform } from "@knitto/shared";
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
  jobPlatform?: AutomationPlatform;
  testCaseCount?: number;
  status?: AgentJobMessage["status"];
  progress?: number;
  result?: string;
  screenshots?: string[];
  videoUrl?: string;
  videoUrls?: string[];
  videoRecordingMeta?: AgentJobMessage["videoRecordingMeta"];
  testCaseResults?: TestCaseResult[];
  testCaseIndex?: number;
  testCaseTotal?: number;
  testCaseId?: string;
  testCasePlatform?: AgentJobMessage["testCasePlatform"];
  testCaseStatus?: AgentJobMessage["testCaseStatus"];
  testCases?: AgentJobMessage["testCases"];
  toolName?: string;
};
