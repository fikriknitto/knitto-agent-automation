import { randomBytes } from "node:crypto";
import type { BridgeKind, BridgeInfo } from "@knitto/shared";
import { createLogger } from "../platforms/mcp-kit/core/index.js";
import { CursorAgentService } from "./cursor-agent.service.js";
import { OpenaiAgentService } from "./openai-agent.service.js";
import type {
  AgentRuntime,
  ConfigChanged,
  CredentialsRequest,
  CredentialsStatusEmitter,
  JobBroadcast,
} from "./agent-runtime.interface.js";

const logger = createLogger("agent-registry");

const AGENT_LABELS: Record<BridgeKind, string> = {
  cursor: "Cursor",
  openai: "OpenAI-compatible",
};

function createAgentId(kind: BridgeKind): string {
  return `${kind}-${randomBytes(4).toString("hex")}`;
}

export class AgentRegistryService {
  private readonly runners = new Map<string, AgentRuntime>();

  constructor(
    private readonly emitJob: JobBroadcast,
    private readonly requestCredentials: CredentialsRequest,
    private readonly emitCredentialsStatus: CredentialsStatusEmitter,
    private readonly onConfigChanged: ConfigChanged
  ) {}

  async startAll(): Promise<void> {
    const kinds: Array<{
      kind: BridgeKind;
      factory: (id: string) => AgentRuntime;
    }> = [
      {
        kind: "cursor",
        factory: (id) =>
          new CursorAgentService(
            id,
            this.emitJob,
            this.requestCredentials,
            this.emitCredentialsStatus,
            this.onConfigChanged
          ),
      },
      {
        kind: "openai",
        factory: (id) =>
          new OpenaiAgentService(
            id,
            this.emitJob,
            this.requestCredentials,
            this.emitCredentialsStatus,
            this.onConfigChanged
          ),
      },
    ];

    for (const { kind, factory } of kinds) {
      const bridgeId = createAgentId(kind);
      const runner = factory(bridgeId);
      this.runners.set(bridgeId, runner);
      logger.info(`Starting agent runtime ${bridgeId} (${AGENT_LABELS[kind]})`);
      await runner.start();
    }
  }

  get(bridgeId: string): AgentRuntime | undefined {
    return this.runners.get(bridgeId);
  }

  getAll(): BridgeInfo[] {
    return [...this.runners.values()].map((r) => r.getInfo());
  }

  isAvailable(): boolean {
    return this.runners.size > 0;
  }

  findByKind(kind: BridgeKind): AgentRuntime | undefined {
    return [...this.runners.values()].find((r) => r.getInfo().bridgeKind === kind);
  }
}
