import type { PromptAttachment } from "@knitto/shared";
import { readFile, stat } from "node:fs/promises";
import { resolveStorageRoot } from "../../config/paths.js";
import {
  assertAttachmentEligible,
  resolveMimeType,
} from "../storage/attachment-eligibility.js";
import { resolveSafePath, StoragePathError } from "../storage/path-utils.js";

export type SavedAttachment = {
  index: number;
  name: string;
  mimeType: string;
  kind: "image" | "file";
  absolutePath: string;
  storagePath: string;
};

export type VisionAttachment = {
  data: string;
  mimeType: string;
  name: string;
};

export async function resolveJobAttachments(
  attachments?: PromptAttachment[]
): Promise<SavedAttachment[]> {
  if (!attachments?.length) return [];

  const root = resolveStorageRoot();
  const saved: SavedAttachment[] = [];

  for (let i = 0; i < attachments.length; i++) {
    const attachment = attachments[i]!;
    const storagePath = attachment.storagePath.trim();
    if (!storagePath) {
      throw new Error(`Attachment ${i + 1} is missing storagePath`);
    }

    const absolutePath = resolveSafePath(root, storagePath);
    const stats = await stat(absolutePath);
    if (!stats.isFile()) {
      throw new Error(`Storage path is not a file: ${storagePath}`);
    }

    const mimeType = resolveMimeType(attachment.name, attachment.mimeType);
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
  attachments?: PromptAttachment[]
): Promise<VisionAttachment[]> {
  if (!attachments?.length) return [];

  const root = resolveStorageRoot();
  const vision: VisionAttachment[] = [];

  for (const attachment of attachments) {
    if (attachment.kind !== "image") continue;

    const absolutePath = resolveSafePath(root, attachment.storagePath);
    const stats = await stat(absolutePath);
    if (!stats.isFile()) continue;

    const mimeType = resolveMimeType(attachment.name, attachment.mimeType);
    assertAttachmentEligible(attachment.name, mimeType, stats.size);
    const buffer = await readFile(absolutePath);
    vision.push({
      data: buffer.toString("base64"),
      mimeType,
      name: attachment.name,
    });
  }

  return vision;
}

export function isStoragePathError(error: unknown): error is StoragePathError {
  return error instanceof StoragePathError;
}

/** @deprecated Storage attachments are not copied per job; kept for API compatibility */
export async function persistJobAttachments(
  _jobId: string,
  attachments?: PromptAttachment[]
): Promise<SavedAttachment[]> {
  return resolveJobAttachments(attachments);
}

/** @deprecated Files live in storage/; no per-job cleanup */
export async function cleanupJobAttachments(_jobId: string): Promise<void> {
  // no-op
}
