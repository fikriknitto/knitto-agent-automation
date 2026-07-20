import type { PromptAttachment } from "@knitto/shared";
import { mkdir, readFile, writeFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { resolveStorageRoot } from "../../config/paths.js";
import { resolveAgentScreenshotDirForJob } from "../../platforms/browser/job-context.js";
import {
  assertAttachmentEligible,
  resolveMimeType,
} from "../../infra/storage/attachment-eligibility.js";
import { resolveSafePath, StoragePathError } from "../../infra/storage/path-utils.js";
import { getApiDataBaseUrl } from "../../infra/api-data/agent-runs-client.js";

export type SavedAttachment = {
  index: number;
  name: string;
  mimeType: string;
  kind: "image" | "file";
  absolutePath: string;
  storagePath: string;
  mediaId?: number;
};

export type VisionAttachment = {
  data: string;
  mimeType: string;
  name: string;
};

export type ResolveAttachmentsOpts = {
  apiDataToken?: string
  jobId?: string
};

async function downloadMediaToJobTemp(
  token: string,
  mediaId: number,
  fileName: string,
  jobId: string
): Promise<string> {
  const dir = join(resolveAgentScreenshotDirForJob(jobId), "attachments");
  await mkdir(dir, { recursive: true });
  const safe = fileName.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 180) || `media-${mediaId}`;
  const absolutePath = join(dir, `${mediaId}-${safe}`);

  const url = `${getApiDataBaseUrl()}/agent/media/${mediaId}/content`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, Accept: "*/*" },
  });
  if (!res.ok) {
    throw new Error(`Download media ${mediaId} failed: HTTP ${res.status}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(absolutePath, buf);
  return absolutePath;
}

export async function resolveJobAttachments(
  attachments?: PromptAttachment[],
  opts: ResolveAttachmentsOpts = {}
): Promise<SavedAttachment[]> {
  if (!attachments?.length) return [];

  const root = resolveStorageRoot();
  const saved: SavedAttachment[] = [];

  for (let i = 0; i < attachments.length; i++) {
    const attachment = attachments[i]!;
    const mimeType = resolveMimeType(attachment.name, attachment.mimeType);

    if (attachment.mediaId != null) {
      if (!opts.apiDataToken || !opts.jobId) {
        throw new Error(
          `Attachment ${i + 1} (mediaId ${attachment.mediaId}) requires apiDataToken + jobId`
        );
      }
      const absolutePath = await downloadMediaToJobTemp(
        opts.apiDataToken,
        attachment.mediaId,
        attachment.name,
        opts.jobId
      );
      const stats = await stat(absolutePath);
      assertAttachmentEligible(attachment.name, mimeType, stats.size);
      saved.push({
        index: i + 1,
        name: attachment.name,
        mimeType,
        kind: attachment.kind,
        absolutePath,
        storagePath: `media:${attachment.mediaId}`,
        mediaId: attachment.mediaId,
      });
      continue;
    }

    const storagePath = (attachment.storagePath ?? "").trim();
    if (!storagePath) {
      throw new Error(`Attachment ${i + 1} is missing mediaId/storagePath`);
    }

    const absolutePath = resolveSafePath(root, storagePath);
    const stats = await stat(absolutePath);
    if (!stats.isFile()) {
      throw new Error(`Storage path is not a file: ${storagePath}`);
    }

    assertAttachmentEligible(attachment.name, mimeType, stats.size);

    saved.push({
      index: i + 1,
      name: attachment.name,
      mimeType,
      kind: attachment.kind,
      absolutePath,
      storagePath,
    });
  }

  return saved;
}

export async function loadVisionAttachments(
  attachments?: PromptAttachment[],
  opts: ResolveAttachmentsOpts = {}
): Promise<VisionAttachment[]> {
  if (!attachments?.length) return [];

  const resolved = await resolveJobAttachments(attachments, opts);
  const vision: VisionAttachment[] = [];

  for (const item of resolved) {
    if (item.kind !== "image") continue;
    const buffer = await readFile(item.absolutePath);
    vision.push({
      data: buffer.toString("base64"),
      mimeType: item.mimeType,
      name: item.name,
    });
  }

  return vision;
}

export function isStoragePathError(error: unknown): error is StoragePathError {
  return error instanceof StoragePathError;
}

/** @deprecated Storage attachments are not copied per job; kept for API compatibility */
export async function persistJobAttachments(
  jobId: string,
  attachments?: PromptAttachment[],
  opts: Omit<ResolveAttachmentsOpts, "jobId"> = {}
): Promise<SavedAttachment[]> {
  return resolveJobAttachments(attachments, { ...opts, jobId });
}

/** @deprecated Files live in storage/ or job temp; no per-job cleanup */
export async function cleanupJobAttachments(_jobId: string): Promise<void> {
  // no-op
}
