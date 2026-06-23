import type { PromptAttachment } from "@knitto/shared";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { resolveMonorepoRoot, resolveScreenshotDir } from "../../config/paths.js";

export type SavedAttachment = {
  index: number;
  name: string;
  mimeType: string;
  kind: "image" | "file";
  absolutePath: string;
};

function resolveUploadDir(): string {
  const fromEnv = process.env.AUTOMATION_UPLOAD_DIR?.trim();
  if (fromEnv) return resolve(resolveMonorepoRoot(), fromEnv);

  return join(resolveScreenshotDir(), "uploads");
}

function sanitizeFileName(name: string): string {
  const base = name.replace(/[/\\:\0]/g, "_").replace(/\.\./g, "_").trim();
  return base || "attachment.bin";
}

function envBool(key: string, fallback: boolean): boolean {
  const raw = process.env[key]?.trim().toLowerCase();
  if (!raw) return fallback;
  return raw === "1" || raw === "true" || raw === "yes";
}

export async function persistJobAttachments(
  jobId: string,
  attachments?: PromptAttachment[]
): Promise<SavedAttachment[]> {
  if (!attachments?.length) return [];

  const jobDir = join(resolveUploadDir(), jobId);
  await mkdir(jobDir, { recursive: true });

  const saved: SavedAttachment[] = [];

  for (let i = 0; i < attachments.length; i++) {
    const attachment = attachments[i]!;
    const fileName = sanitizeFileName(attachment.name || `attachment-${i + 1}`);
    const absolutePath = resolve(jobDir, fileName);
    const buffer = Buffer.from(attachment.data, "base64");
    await writeFile(absolutePath, buffer);

    saved.push({
      index: i + 1,
      name: fileName,
      mimeType: attachment.mimeType,
      kind: attachment.kind,
      absolutePath,
    });
  }

  return saved;
}

export async function cleanupJobAttachments(jobId: string): Promise<void> {
  if (!envBool("AUTOMATION_UPLOAD_CLEANUP", false)) return;
  const jobDir = join(resolveUploadDir(), jobId);
  await rm(jobDir, { recursive: true, force: true });
}
