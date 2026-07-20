/**
 * API Data (Knitto Api Automation QA Data) HTTP client for Worker.
 * JWT is forwarded from FE via user_prompt.apiDataToken (AUTH MVP).
 */

const DEFAULT_BASE = "http://localhost:8009";

export function getApiDataBaseUrl(): string {
  const raw = process.env.API_DATA_BASE_URL?.trim();
  if (!raw) return DEFAULT_BASE;
  return raw.replace(/\/+$/, "");
}

/** Stale RUNNING policy (W2): 6 hours. Resume not supported. */
export const AGENT_RUN_STALE_MS = Number(
  process.env.AGENT_RUN_STALE_MS ?? 6 * 60 * 60 * 1000
);

export type AgentRuntime = "cursor" | "openai";

export type PatchAgentRunBody = {
  status?: "QUEUED" | "RUNNING" | "FINISHED" | "CANCELLED" | "ERROR"
  outcome?: "PASSED" | "FAILED" | "PARTIAL" | null
  summary?: string | null
  error?: string | null
  platform?: string | null
  workerHost?: string | null
};

export type UpsertCaseItem = {
  testCaseId?: number | null
  caseOrder: number
  title?: string | null
  status: "PASSED" | "ERROR" | "SKIPPED" | "RUNNING"
  summary?: string | null
  error?: string | null
  durationMs?: number | null
};

type ApiDataEnvelope<T> = {
  message?: string
  result?: T
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
    throw new ApiDataHttpError(
      json.message || `API Data ${opts.method} ${path} failed: HTTP ${res.status}`,
      res.status
    );
  }

  return json.result as T;
}

export async function patchAgentRun(
  token: string,
  runId: number,
  body: PatchAgentRunBody
): Promise<void> {
  await apiDataFetch(`/agent/runs/${runId}`, {
    method: "PATCH",
    token,
    body,
  });
}

export async function upsertAgentRunCases(
  token: string,
  runId: number,
  items: UpsertCaseItem[]
): Promise<void> {
  if (!items.length) return;
  await apiDataFetch(`/agent/runs/${runId}/cases`, {
    method: "POST",
    token,
    body: { items },
  });
}

export async function getAgentRunByJobId(
  token: string,
  agentJobId: string
): Promise<{ runId: number; status: string } | null> {
  try {
    const result = await apiDataFetch<{ runId: number; status: string }>(
      `/agent/runs/by-agent-job/${encodeURIComponent(agentJobId)}`,
      { method: "GET", token }
    );
    return result ?? null;
  } catch {
    return null;
  }
}

export async function appendAgentRunLogs(
  token: string,
  runId: number,
  items: Array<{ level?: "INFO" | "WARNING" | "ERROR"; message: string }>
): Promise<void> {
  if (!items.length) return;
  await apiDataFetch(`/agent/runs/${runId}/logs`, {
    method: "POST",
    token,
    body: { items },
  });
}

export type UploadedMedia = {
  mediaId: number
  name: string
  kind: string
  contentType: string | null
};

export type LinkedRunMedia = {
  id: number
  mediaId: number
  role: string
  url?: string | null
};

export class ApiDataHttpError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiDataHttpError";
    this.status = status;
  }
}

function isRetryableApiError(err: unknown): boolean {
  if (err instanceof ApiDataHttpError) {
    if (err.status === 401 || err.status === 403) return false;
    if (err.status === 408 || err.status === 429) return true;
    if (err.status >= 500) return true;
    return false;
  }
  const message = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
  if (
    message.includes("fetch failed") ||
    message.includes("econnrefused") ||
    message.includes("econnreset") ||
    message.includes("etimedout") ||
    message.includes("network") ||
    message.includes("socket")
  ) {
    return true;
  }
  return false;
}

function retryAttempts(): number {
  return Math.max(1, Number(process.env.API_DATA_UPLOAD_MAX_RETRIES ?? "5"));
}

function retryBaseDelayMs(): number {
  return Math.max(100, Number(process.env.API_DATA_UPLOAD_RETRY_DELAY_MS ?? "500"));
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  attempts = retryAttempts()
): Promise<T> {
  const maxAttempts = Math.max(1, attempts);
  const baseDelay = retryBaseDelayMs();
  let last: unknown;

  for (let i = 0; i < maxAttempts; i++) {
    try {
      return await fn();
    } catch (error) {
      last = error;
      const canRetry = isRetryableApiError(error) && i < maxAttempts - 1;
      if (!canRetry) break;
      const delay = baseDelay * 2 ** i;
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw last instanceof Error ? last : new Error(String(last));
}

export async function uploadAgentMedia(
  token: string,
  opts: {
    filePath: string
    fileName: string
    contentType?: string
    runId?: number
    caseOrder?: number
    source?: "worker_evidence" | "upload_ui" | "attachment"
  }
): Promise<UploadedMedia> {
  return withRetry(async () => {
    const { readFile } = await import("node:fs/promises");
    const buffer = await readFile(opts.filePath);
    const form = new FormData();
    form.append(
      "file",
      new Blob([buffer], { type: opts.contentType || "application/octet-stream" }),
      opts.fileName
    );
    form.append("source", opts.source || "worker_evidence");
    if (opts.runId != null) form.append("runId", String(opts.runId));
    if (opts.caseOrder != null) form.append("caseOrder", String(opts.caseOrder));

    const url = `${getApiDataBaseUrl()}/agent/media/upload`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      body: form,
    });
    const json = (await res.json().catch(() => ({}))) as ApiDataEnvelope<UploadedMedia> & {
      message?: string
    };
    if (!res.ok) {
      throw new ApiDataHttpError(
        json.message || `upload media failed: HTTP ${res.status}`,
        res.status
      );
    }
    return json.result as UploadedMedia;
  });
}

export async function linkAgentRunMedia(
  token: string,
  runId: number,
  body: {
    mediaId: number
    role: "screenshot" | "video" | "attachment" | "other"
    agentRunCaseId?: number | null
    caseOrder?: number | null
  }
): Promise<LinkedRunMedia> {
  return withRetry(() =>
    apiDataFetch<LinkedRunMedia>(`/agent/runs/${runId}/media`, {
      method: "POST",
      token,
      body,
    })
  );
}

export async function getAgentRunResults(
  token: string,
  runId: number
): Promise<{
  media?: Array<{
    mediaId: number
    role: string
    url?: string | null
    name?: string | null
    kind?: string | null
  }>
}> {
  return apiDataFetch(`/agent/runs/${runId}/results`, {
    method: "GET",
    token,
  });
}
