import { GoogleGenAI } from "@google/genai";
import config from "./config.js";

export interface ModelCatalogEntry {
  id: string;
  label: string;
  vision?: boolean;
}

export interface ModelCatalog {
  defaultModel: string;
  models: ModelCatalogEntry[];
}

const FALLBACK_MODELS: ModelCatalogEntry[] = [
  { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash", vision: true },
  { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro", vision: true },
  { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash", vision: true },
];

export function fallbackModelCatalog(defaultModel = config.modelId): ModelCatalog {
  const models = FALLBACK_MODELS.some((m) => m.id === defaultModel)
    ? FALLBACK_MODELS
    : [{ id: defaultModel, label: defaultModel, vision: true }, ...FALLBACK_MODELS];
  return { defaultModel, models };
}

function normalizeModelId(name: string | undefined): string | null {
  if (!name) return null;
  const trimmed = name.trim();
  if (!trimmed) return null;
  return trimmed.replace(/^models\//, "");
}

export async function validateGeminiApiKey(
  apiKey: string
): Promise<{ valid: boolean; message: string }> {
  const trimmed = apiKey.trim();
  if (!trimmed) {
    return { valid: false, message: "API key is empty" };
  }

  try {
    const ai = new GoogleGenAI({ apiKey: trimmed });
    const pager = await ai.models.list();
    for await (const _model of pager) {
      return { valid: true, message: "Gemini API key verified" };
    }
    return { valid: false, message: "No models returned — check your Gemini API key" };
  } catch (error) {
    return {
      valid: false,
      message: error instanceof Error ? error.message : "Invalid Gemini API key",
    };
  }
}

export async function fetchModelCatalog(apiKey: string): Promise<ModelCatalog> {
  const defaultModel = config.modelId;

  if (!apiKey) return fallbackModelCatalog(defaultModel);

  try {
    const ai = new GoogleGenAI({ apiKey });
    const pager = await ai.models.list();
    const models: ModelCatalogEntry[] = [];

    for await (const model of pager) {
      const id = normalizeModelId(model.name);
      if (!id || !id.startsWith("gemini-")) continue;
      if (id.includes("embedding") || id.includes("aqa") || id.includes("imagen")) continue;

      models.push({
        id,
        label: model.displayName?.trim() || id,
        vision: true,
      });
    }

    if (!models.length) return fallbackModelCatalog(defaultModel);

    const preferred = models.find((m) => m.id === defaultModel);
    return {
      defaultModel: preferred ? defaultModel : models[0]!.id,
      models,
    };
  } catch {
    return fallbackModelCatalog(defaultModel);
  }
}
