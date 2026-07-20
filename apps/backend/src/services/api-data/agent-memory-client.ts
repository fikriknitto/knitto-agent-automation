/**
 * API Data client for app memory + prompt shortcuts (Worker / MCP).
 */
import { getApiDataBaseUrl } from "./agent-runs-client.js";
import { getApiDataJobToken } from "./api-data-job-context.js";

type ApiDataEnvelope<T> = {
  message?: string
  result?: T
};

export type AppMemoryScope = "browser" | "mobile";

export type ApiAppMemory = {
  appId: string
  scope: AppMemoryScope
  content: string
  updatedAt: string | null
  exists?: boolean
};

export type ApiPromptShortcut = {
  id: string
  label: string
  icon: string
  variant: string
  platform: string
  appPackage?: string
  url?: string
  deepLink?: string
  template: string
  defaults: Record<string, string>
};

async function apiDataFetch<T>(
  path: string,
  opts: {
    method: string
    token: string
    body?: unknown
  }
): Promise<T> {
  const url = `${getApiDataBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
  const res = await fetch(url, {
    method: opts.method,
    headers: {
      Authorization: `Bearer ${opts.token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });

  const json = (await res.json().catch(() => ({}))) as ApiDataEnvelope<T> & {
    message?: string
  };

  if (!res.ok) {
    throw new Error(
      json.message || `API Data ${opts.method} ${path} failed: HTTP ${res.status}`
    );
  }

  return json.result as T;
}

function requireToken(explicit?: string | null): string {
  const token = explicit?.trim() || getApiDataJobToken();
  if (!token) {
    throw new Error(
      "API_DATA_TOKEN / job.apiDataToken required for app memory & prompt shortcuts (API Data)."
    );
  }
  return token;
}

export async function getAgentAppMemory(
  scope: AppMemoryScope,
  appId: string,
  token?: string | null
): Promise<ApiAppMemory> {
  const jwt = requireToken(token);
  return apiDataFetch(
    `/agent/app-memory/${encodeURIComponent(appId)}?scope=${scope}`,
    { method: "GET", token: jwt }
  );
}

export async function putAgentAppMemory(
  opts: {
    scope: AppMemoryScope
    appId: string
    content: string
    mode?: "replace" | "upsert_section"
    sectionKey?: string
    token?: string | null
  }
): Promise<ApiAppMemory> {
  const jwt = requireToken(opts.token);
  return apiDataFetch(`/agent/app-memory/${encodeURIComponent(opts.appId)}`, {
    method: "PUT",
    token: jwt,
    body: {
      scope: opts.scope,
      content: opts.content,
      mode: opts.mode ?? "replace",
      ...(opts.sectionKey ? { sectionKey: opts.sectionKey } : {}),
    },
  });
}

export async function getAgentPromptShortcut(
  id: string,
  token?: string | null
): Promise<ApiPromptShortcut> {
  const jwt = requireToken(token);
  return apiDataFetch(`/agent/prompt-shortcuts/${encodeURIComponent(id)}`, {
    method: "GET",
    token: jwt,
  });
}

export async function listAgentPromptShortcuts(
  token?: string | null
): Promise<ApiPromptShortcut[]> {
  const jwt = requireToken(token);
  const rows = await apiDataFetch<ApiPromptShortcut[]>("/agent/prompt-shortcuts", {
    method: "GET",
    token: jwt,
  });
  return rows ?? [];
}
