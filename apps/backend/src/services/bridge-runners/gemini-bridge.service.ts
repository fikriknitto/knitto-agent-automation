import type { AgentJobCancelMessage, BridgeInfo, BridgeModelOption, UserPromptMessage } from "@knitto/shared";
import { createLogger } from "../../automation/core/index.js";
import { browserHeadedFromEnv } from "../shared/browser-env.js";
import { JobQueue } from "../shared/queue.js";
import config, { setGeminiApiKey } from "./gemini/config.js";
import { startBridgeJob } from "./gemini/agent-runner.js";
import {
  fallbackModelCatalog,
  fetchModelCatalog,
  validateGeminiApiKey,
  type ModelCatalog,
} from "./gemini/model-catalog.js";
import type {
  BridgeRunner,
  ConfigChanged,
  CredentialsRequest,
  CredentialsStatusEmitter,
  JobBroadcast,
} from "./bridge-runner.interface.js";

const logger = createLogger("gemini-bridge");

function catalogSignature(catalog: ModelCatalog): string {
  return `${catalog.defaultModel}|${catalog.models.map((m) => m.id).join(",")}`;
}

export class GeminiBridgeService implements BridgeRunner {
  private readonly queue: JobQueue;
  private lastAppliedApiKey: string | null = null;
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
      bridgeKind: "gemini",
      bridgeLabel: "Gemini",
      defaultModel: this.defaultModel,
      models: this.models,
      browserHeaded: this.browserHeaded,
    };
  }

  async start(): Promise<void> {
    if (config.geminiApiKey) {
      await this.applyCredentials(config.geminiApiKey);
    } else {
      this.requestCredentials(this.bridgeId, "gemini");
      this.publishConfig(fallbackModelCatalog(config.modelId));
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

    const apiKey = typeof data.apiKey === "string" ? data.apiKey.trim() : "";
    if (!apiKey) return;

    void this.applyCredentials(apiKey);
  }

  private async applyCredentials(apiKey: string): Promise<void> {
    if (apiKey === this.lastAppliedApiKey && config.geminiApiKey === apiKey) {
      return;
    }

    const { valid, message } = await validateGeminiApiKey(apiKey);

    if (valid) {
      setGeminiApiKey(apiKey);
      this.lastAppliedApiKey = apiKey;
      logger.info("Gemini API key verified");
      await this.publishFromApi();
    } else {
      setGeminiApiKey("");
      this.lastAppliedApiKey = null;
      logger.warn(`Gemini API key rejected: ${message}`);
      this.publishConfig(fallbackModelCatalog(config.modelId));
    }

    this.emitCredentialsStatus(this.bridgeId, "gemini", valid, message);
  }

  private async publishFromApi(): Promise<void> {
    this.publishConfig(fallbackModelCatalog(config.modelId));
    if (!config.geminiApiKey) return;
    try {
      const catalog = await fetchModelCatalog(config.geminiApiKey);
      this.publishConfig(catalog);
    } catch (error) {
      logger.warn(
        `Gemini model catalog fetch failed: ${
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
    logger.info(`Published Gemini config (${catalog.models.length} models)`);
  }
}
