import config, {
  nineRouterApiV1,
  type NinerouterCredentials,
} from "./config.js";

export interface ModelCatalogEntry {
  id: string;
  label: string;
  vision?: boolean;
}

export interface ModelCatalog {
  defaultModel: string;
  models: ModelCatalogEntry[];
}

/** OpenAI-compatible model list from GET {baseUrl}/v1 */
export interface NineRouterModelsResponse {
  object: string;
  data: Array<{
    id: string;
    object: string;
    owned_by: string;
  }>;
}

const FALLBACK_MODELS: ModelCatalogEntry[] = [
  { id: "automation", label: "automation (combo)", vision: true },
];

export function fallbackModelCatalog(defaultModel?: string): ModelCatalog {
  const model = defaultModel?.trim() || FALLBACK_MODELS[0]!.id;
  const models = FALLBACK_MODELS.some((m) => m.id === model)
    ? FALLBACK_MODELS
    : [{ id: model, label: model, vision: true }, ...FALLBACK_MODELS];
  return { defaultModel: model, models };
}

function modelLabel(item: NineRouterModelsResponse["data"][number]): string {
  if (item.owned_by && item.owned_by !== item.id) {
    return `${item.id} (${item.owned_by})`;
  }
  return item.id;
}

async function fetchModels(creds: NinerouterCredentials): Promise<ModelCatalogEntry[]> {
  const url = nineRouterApiV1(creds.baseUrl);
  const headers: Record<string, string> = { Accept: "application/json" };
  if (creds.apiKey) headers.Authorization = `Bearer ${creds.apiKey}`;

  const response = await fetch(url, { headers });
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(body || `9Router models request failed (${response.status})`);
  }

  const payload = (await response.json()) as NineRouterModelsResponse;
  const models: ModelCatalogEntry[] = [];

  for (const item of payload.data ?? []) {
    const id = typeof item.id === "string" ? item.id.trim() : "";
    if (!id || item.object !== "model") continue;
    models.push({
      id,
      label: modelLabel(item),
      vision: true,
    });
  }

  return models;
}

export async function validateNinerouterCredentials(
  creds: NinerouterCredentials
): Promise<{ valid: boolean; message: string }> {
  const baseUrl = creds.baseUrl.trim();
  if (!baseUrl) {
    return { valid: false, message: "9Router base URL is empty" };
  }

  try {
    const models = await fetchModels(creds);
    if (!models.length) {
      return {
        valid: false,
        message: "9Router reachable but no models returned — check dashboard config",
      };
    }
    return { valid: true, message: "9Router credentials verified" };
  } catch (error) {
    return {
      valid: false,
      message: error instanceof Error ? error.message : "Cannot reach 9Router",
    };
  }
}

export async function fetchModelCatalog(creds: NinerouterCredentials): Promise<ModelCatalog> {
  const preferred = config.modelId.trim();

  if (!creds.baseUrl.trim()) {
    return fallbackModelCatalog(preferred || undefined);
  }

  try {
    const models = await fetchModels(creds);
    if (!models.length) return fallbackModelCatalog(preferred || undefined);

    const hasPreferred = preferred && models.some((m) => m.id === preferred);
    return {
      defaultModel: hasPreferred ? preferred : models[0]!.id,
      models,
    };
  } catch {
    return fallbackModelCatalog(preferred || undefined);
  }
}
