import { randomBytes } from "node:crypto";
import type { BridgeKind, BridgeInfo } from "@knitto/shared";
import { createLogger } from "../automation/core/index.js";
import { CursorBridgeService } from "./bridge-runners/cursor-bridge.service.js";
import { GeminiBridgeService } from "./bridge-runners/gemini-bridge.service.js";
import { NinerouterBridgeService } from "./bridge-runners/ninerouter-bridge.service.js";
import type {
  BridgeRunner,
  ConfigChanged,
  CredentialsRequest,
  CredentialsStatusEmitter,
  JobBroadcast,
} from "./bridge-runners/bridge-runner.interface.js";

const logger = createLogger("bridge-registry");

const BRIDGE_LABELS: Record<BridgeKind, string> = {
  cursor: "Cursor",
  gemini: "Gemini",
  openrouter: "OpenRouter",
  ninerouter: "9Router",
};

function createBridgeId(kind: BridgeKind): string {
  return `${kind}-${randomBytes(4).toString("hex")}`;
}

export class BridgeRegistryService {
  private readonly runners = new Map<string, BridgeRunner>();

  constructor(
    private readonly emitJob: JobBroadcast,
    private readonly requestCredentials: CredentialsRequest,
    private readonly emitCredentialsStatus: CredentialsStatusEmitter,
    private readonly onConfigChanged: ConfigChanged
  ) {}

  async startAll(): Promise<void> {
    const kinds: Array<{ kind: BridgeKind; factory: (id: string) => BridgeRunner }> = [
      {
        kind: "gemini",
        factory: (id) =>
          new GeminiBridgeService(
            id,
            this.emitJob,
            this.requestCredentials,
            this.emitCredentialsStatus,
            this.onConfigChanged
          ),
      },
      {
        kind: "cursor",
        factory: (id) =>
          new CursorBridgeService(
            id,
            this.emitJob,
            this.requestCredentials,
            this.emitCredentialsStatus,
            this.onConfigChanged
          ),
      },
      {
        kind: "ninerouter",
        factory: (id) =>
          new NinerouterBridgeService(
            id,
            this.emitJob,
            this.requestCredentials,
            this.emitCredentialsStatus,
            this.onConfigChanged
          ),
      },
    ];

    for (const { kind, factory } of kinds) {
      const bridgeId = createBridgeId(kind);
      const runner = factory(bridgeId);
      this.runners.set(bridgeId, runner);
      logger.info(`Starting internal bridge ${bridgeId} (${BRIDGE_LABELS[kind]})`);
      await runner.start();
    }
  }

  get(bridgeId: string): BridgeRunner | undefined {
    return this.runners.get(bridgeId);
  }

  getAll(): BridgeInfo[] {
    return [...this.runners.values()].map((r) => r.getInfo());
  }

  isAvailable(): boolean {
    return this.runners.size > 0;
  }

  findByKind(kind: BridgeKind): BridgeRunner | undefined {
    return [...this.runners.values()].find((r) => r.getInfo().bridgeKind === kind);
  }
}
