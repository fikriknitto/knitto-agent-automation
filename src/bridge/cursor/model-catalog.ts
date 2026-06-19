import { Cursor } from "@cursor/sdk";
import config from "./config.js";

export interface ModelCatalogEntry {
  id: string;
  label: string;
}

export interface ModelCatalog {
  defaultModel: string;
  models: ModelCatalogEntry[];
}

const FALLBACK_MODELS: ModelCatalogEntry[] = [
  { id: "auto", label: "Auto" },
  { id: "composer-2.5", label: "Composer 2.5" },
];

export function fallbackModelCatalog(defaultModel = config.modelId): ModelCatalog {
  const models = FALLBACK_MODELS.some((m) => m.id === defaultModel)
    ? FALLBACK_MODELS
    : [{ id: defaultModel, label: defaultModel }, ...FALLBACK_MODELS];
  return { defaultModel, models };
}

export async function validateCursorApiKey(
  apiKey: string
): Promise<{ valid: boolean; message: string }> {
  const trimmed = apiKey.trim();
  if (!trimmed) {
    return { valid: false, message: "API key is empty" };
  }

  try {
    const listed = await Cursor.models.list({ apiKey: trimmed });
    if (!listed.length) {
      return { valid: false, message: "No models returned — check your Cursor API key" };
    }
    return { valid: true, message: "Cursor API key verified" };
  } catch (error) {
    return {
      valid: false,
      message: error instanceof Error ? error.message : "Invalid Cursor API key",
    };
  }
}

export async function fetchModelCatalog(apiKey: string): Promise<ModelCatalog> {
  const defaultModel = config.modelId;

  if (!apiKey) return fallbackModelCatalog(defaultModel);

  try {
    const listed = await Cursor.models.list({ apiKey });
    const models: ModelCatalogEntry[] = listed.map((m) => ({
      id: m.id,
      label: m.displayName || m.id,
    }));

    if (!models.length) return fallbackModelCatalog(defaultModel);

    const hasDefault = models.some((m) => m.id === defaultModel);
    return {
      defaultModel: hasDefault ? defaultModel : models[0]!.id,
      models,
    };
  } catch {
    return fallbackModelCatalog(defaultModel);
  }
}
