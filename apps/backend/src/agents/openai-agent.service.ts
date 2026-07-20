import type {
  AgentJobCancelMessage,
  BridgeInfo,
  BridgeModelOption,
  UserPromptMessage,
} from "@knitto/shared";
import { createLogger } from "../platforms/browser/core/index.js";
import { browserHeadedFromEnv } from "../core/evidence/browser-env.js";
import { JobQueue } from "../core/orchestration/queue.js";
import { startBridgeJob } from "./openai/agent-runner.js";
import config, {
  setOpenaiCredentials,
  type OpenaiCredentials,
} from "./openai/config.js";
import {
  fallbackModelCatalog,
  fetchModelCatalog,
  validateOpenaiCredentials,
  type ModelCatalog,
} from "./openai/model-catalog.js";
import type {
  AgentRuntime,
  ConfigChanged,
  CredentialsRequest,
  CredentialsStatusEmitter,
  JobBroadcast,
} from "./agent-runtime.interface.js";

const logger = createLogger("openai-agent");

function catalogSignature(catalog: ModelCatalog): string {
  return `${catalog.defaultModel}|${catalog.models.map((m) => m.id).join(",")}`;
}

function credentialKey(creds: OpenaiCredentials): string {
  return `${creds.baseUrl}|${creds.apiKey}`;
}

function parseCredentials(data: Record<string, unknown>): OpenaiCredentials | null {
  const nested = data.openai;
  if (!nested || typeof nested !== "object") return null;
  const record = nested as Record<string, unknown>;
  const baseUrl = typeof record.baseUrl === "string" ? record.baseUrl.trim() : "";
  if (!baseUrl) return null;
  return {
    baseUrl,
    apiKey: typeof record.apiKey === "string" ? record.apiKey.trim() : "",
  };
}

/** OpenAI-compatible runtime (knitto-agent). */
export class OpenaiAgentService implements AgentRuntime {
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
      bridgeKind: "openai",
      bridgeLabel: "OpenAI-compatible",
      defaultModel: this.defaultModel,
      models: this.models,
      browserHeaded: this.browserHeaded,
    };
  }

  async start(): Promise<void> {
    this.requestCredentials(this.bridgeId, "openai");
    this.publishConfig(fallbackModelCatalog(config.modelId || undefined));
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

  private async applyCredentials(creds: OpenaiCredentials): Promise<void> {
    const key = credentialKey(creds);
    if (
      key === this.lastAppliedCredentials &&
      credentialKey(config.openaiCredentials) === key
    ) {
      return;
    }

    const { valid, message } = await validateOpenaiCredentials(creds);

    // Always keep what the user sent (including apiKey) so a transient catalog
    // failure does not force re-entry. Jobs still need a successful verify for catalog.
    setOpenaiCredentials(creds);

    if (valid) {
      this.lastAppliedCredentials = key;
      logger.info("OpenAI-compatible credentials verified");
      await this.publishFromApi();
    } else {
      this.lastAppliedCredentials = null;
      logger.warn(`OpenAI-compatible credentials rejected: ${message}`);
      this.publishConfig(fallbackModelCatalog(config.modelId || undefined));
    }

    this.emitCredentialsStatus(this.bridgeId, "openai", valid, message);
  }

  private async publishFromApi(): Promise<void> {
    this.publishConfig(fallbackModelCatalog(config.modelId || undefined));
    const creds = config.openaiCredentials;
    if (!creds.baseUrl.trim()) return;
    try {
      const catalog = await fetchModelCatalog(creds);
      this.publishConfig(catalog);
    } catch (error) {
      logger.warn(
        `OpenAI-compatible model catalog fetch failed: ${
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
    logger.info(`Published OpenAI-compatible config (${catalog.models.length} models)`);
  }
}
