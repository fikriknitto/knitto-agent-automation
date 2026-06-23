import type {
  AgentJobCancelMessage,
  BridgeInfo,
  BridgeModelOption,
  UserPromptMessage,
} from "@knitto/shared";
import { createLogger } from "../../automation/core/index.js";
import { browserHeadedFromEnv } from "../shared/browser-env.js";
import { JobQueue } from "../shared/queue.js";
import { startBridgeJob } from "./ninerouter/agent-runner.js";
import config, {
  setNinerouterCredentials,
  type NinerouterCredentials,
} from "./ninerouter/config.js";
import {
  fallbackModelCatalog,
  fetchModelCatalog,
  validateNinerouterCredentials,
  type ModelCatalog,
} from "./ninerouter/model-catalog.js";
import type {
  BridgeRunner,
  ConfigChanged,
  CredentialsRequest,
  CredentialsStatusEmitter,
  JobBroadcast,
} from "./bridge-runner.interface.js";

const logger = createLogger("ninerouter-bridge");

function catalogSignature(catalog: ModelCatalog): string {
  return `${catalog.defaultModel}|${catalog.models.map((m) => m.id).join(",")}`;
}

function credentialKey(creds: NinerouterCredentials): string {
  return `${creds.baseUrl}|${creds.apiKey}`;
}

function parseCredentials(data: Record<string, unknown>): NinerouterCredentials | null {
  const nested = data.ninerouter;
  if (!nested || typeof nested !== "object") return null;
  const record = nested as Record<string, unknown>;
  const baseUrl = typeof record.baseUrl === "string" ? record.baseUrl.trim() : "";
  if (!baseUrl) return null;
  return {
    baseUrl,
    apiKey: typeof record.apiKey === "string" ? record.apiKey.trim() : "",
  };
}

export class NinerouterBridgeService implements BridgeRunner {
  private readonly queue: JobQueue;
  private lastAppliedCredentials: string | null = null;
  private lastConfigSignature: string | null = null;
  private defaultModel = config.modelId;
  private models: BridgeModelOption[] = [];
  private browserHeaded = browserHeadedFromEnv();

  constructor(
    readonly bridgeId: string,
    private readonly emitJob: JobBroadcast,
    private readonly requestCredentials: CredentialsRequest,
    private readonly emitCredentialsStatus: CredentialsStatusEmitter,
    private readonly onConfigChanged: ConfigChanged
  ) {
    this.queue = new JobQueue(
      (msg) => this.emitJob({ ...msg, bridgeId: this.bridgeId }),
      config.maxConcurrentPerChannel,
      startBridgeJob
    );
  }

  getInfo(): BridgeInfo {
    return {
      bridgeId: this.bridgeId,
      bridgeKind: "ninerouter",
      bridgeLabel: "9Router",
      defaultModel: this.defaultModel,
      models: this.models,
      browserHeaded: this.browserHeaded,
    };
  }

  async start(): Promise<void> {
    const envCreds = config.ninerouterCredentials;
    if (envCreds.baseUrl.trim()) {
      await this.applyCredentials(envCreds);
    } else {
      this.requestCredentials(this.bridgeId, "ninerouter");
      this.publishConfig(fallbackModelCatalog(config.modelId || undefined));
    }
  }

  handleUserPrompt(msg: UserPromptMessage): void {
    this.queue.enqueueFromMessage(msg);
  }

  handleJobCancel(msg: AgentJobCancelMessage): void {
    void this.queue.cancel(msg.id, msg.channel);
  }

  handleCredentials(data: Record<string, unknown>): void {
    const bridgeId = typeof data.bridgeId === "string" ? data.bridgeId : null;
    if (bridgeId && bridgeId !== this.bridgeId) return;

    const creds = parseCredentials(data);
    if (!creds) return;

    void this.applyCredentials(creds);
  }

  private async applyCredentials(creds: NinerouterCredentials): Promise<void> {
    const key = credentialKey(creds);
    if (
      key === this.lastAppliedCredentials &&
      credentialKey(config.ninerouterCredentials) === key
    ) {
      return;
    }

    const { valid, message } = await validateNinerouterCredentials(creds);

    if (valid) {
      setNinerouterCredentials(creds);
      this.lastAppliedCredentials = key;
      logger.info("9Router credentials verified");
      await this.publishFromApi();
    } else {
      setNinerouterCredentials({ baseUrl: creds.baseUrl, apiKey: "" });
      this.lastAppliedCredentials = null;
      logger.warn(`9Router credentials rejected: ${message}`);
      this.publishConfig(fallbackModelCatalog(config.modelId || undefined));
    }

    this.emitCredentialsStatus(this.bridgeId, "ninerouter", valid, message);
  }

  private async publishFromApi(): Promise<void> {
    this.publishConfig(fallbackModelCatalog(config.modelId || undefined));
    const creds = config.ninerouterCredentials;
    if (!creds.baseUrl.trim()) return;
    try {
      const catalog = await fetchModelCatalog(creds);
      this.publishConfig(catalog);
    } catch (error) {
      logger.warn(
        `9Router model catalog fetch failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  private publishConfig(catalog: ModelCatalog): void {
    const signature = catalogSignature(catalog);
    if (signature === this.lastConfigSignature) return;
    this.lastConfigSignature = signature;
    this.defaultModel = catalog.defaultModel;
    this.models = catalog.models;
    this.browserHeaded = browserHeadedFromEnv();
    this.onConfigChanged();
    logger.info(`Published 9Router config (${catalog.models.length} models)`);
  }
}
