import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { resolveScreenshotDir } from "../../config/paths.js";
import { createLogger } from "../../core/logging.js";
import {
  EVIDENCE_MANIFEST_NAME,
  flushEvidenceManifestForJob,
  readEvidenceManifest,
} from "./evidence-upload.js";
import {
  getEvidenceUploadToken,
  listEvidenceUploadTokenEntries,
} from "./evidence-upload-token-registry.js";

const logger = createLogger("evidence-flush");

const DEFAULT_INTERVAL_MS = 60_000;

let intervalHandle: ReturnType<typeof setInterval> | null = null;
let flushing = false;

function agentsRoot(): string {
  return join(resolveScreenshotDir(), "agents");
}

function listJobDirsWithPendingManifest(): string[] {
  const root = agentsRoot();
  if (!existsSync(root)) return [];

  const jobIds: string[] = [];
  for (const name of readdirSync(root, { withFileTypes: true })) {
    if (!name.isDirectory()) continue;
    const manifestPath = join(root, name.name, EVIDENCE_MANIFEST_NAME);
    if (!existsSync(manifestPath)) continue;
    const manifest = readEvidenceManifest(name.name);
    if (!manifest) continue;
    if (manifest.files.some((f) => f.status !== "uploaded")) {
      jobIds.push(manifest.agentJobId || name.name);
    }
  }
  return jobIds;
}

export async function flushPendingEvidenceUploads(): Promise<void> {
  if (flushing) return;
  flushing = true;
  try {
    const pendingJobIds = new Set(listJobDirsWithPendingManifest());
    for (const entry of listEvidenceUploadTokenEntries()) {
      pendingJobIds.add(entry.agentJobId);
    }

    for (const agentJobId of pendingJobIds) {
      const auth = getEvidenceUploadToken(agentJobId);
      if (!auth) {
        logger
          .child({ agentJobId })
          .debug("Skip flush — no in-memory token (restart limitation)");
        continue;
      }

      const manifest = readEvidenceManifest(agentJobId);
      if (!manifest?.files.some((f) => f.status !== "uploaded")) {
        continue;
      }

      logger.child({ agentJobId, runId: auth.runId }).info("Flushing pending evidence");
      const result = await flushEvidenceManifestForJob(
        agentJobId,
        auth.token,
        auth.runId
      );
      if (!result.pending) {
        logger
          .child({ agentJobId, runId: auth.runId })
          .info(`Flush complete uploaded=${result.uploadedCount}`);
      }
    }
  } catch (error) {
    logger.warn(
      `Evidence flush failed: ${error instanceof Error ? error.message : String(error)}`
    );
  } finally {
    flushing = false;
  }
}

export function startEvidenceUploadFlusher(
  intervalMs = Number(process.env.EVIDENCE_UPLOAD_FLUSH_MS ?? DEFAULT_INTERVAL_MS)
): void {
  if (intervalHandle) return;
  void flushPendingEvidenceUploads();
  intervalHandle = setInterval(() => {
    void flushPendingEvidenceUploads();
  }, Math.max(5_000, intervalMs));
  logger.info(`Evidence upload flusher started (every ${Math.max(5_000, intervalMs)}ms)`);
}

export function stopEvidenceUploadFlusher(): void {
  if (!intervalHandle) return;
  clearInterval(intervalHandle);
  intervalHandle = null;
}
