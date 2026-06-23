import type {
  AgentJobCancelMessage,
  AgentJobMessage,
  BridgeInfo,
  BridgeKind,
  UserPromptMessage,
} from "@knitto/shared";

export type JobBroadcast = (msg: AgentJobMessage) => void;

export type CredentialsRequest = (bridgeId: string, bridgeKind: BridgeKind) => void;

export type CredentialsStatusEmitter = (
  bridgeId: string,
  bridgeKind: BridgeKind,
  valid: boolean,
  message: string
) => void;

export type ConfigChanged = () => void;

export interface BridgeRunner {
  readonly bridgeId: string;
  getInfo(): BridgeInfo;
  start(): Promise<void>;
  handleUserPrompt(msg: UserPromptMessage): void;
  handleJobCancel(msg: AgentJobCancelMessage): void;
  handleCredentials(data: Record<string, unknown>): void;
}
