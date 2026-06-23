import { getExtension, guessMimeType } from "./path-utils.js";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_FILE_BYTES = 10 * 1024 * 1024;

const IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);
const FILE_TYPES = new Set([
  "application/pdf",
  "text/csv",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/zip",
  "application/x-zip-compressed",
]);

const BLOCKED_EXTENSIONS = new Set([
  "exe",
  "bat",
  "cmd",
  "sh",
  "msi",
  "dll",
  "ps1",
  "com",
  "scr",
]);

const IMAGE_EXTENSIONS = new Set(["png", "jpg", "jpeg", "webp", "gif"]);
const FILE_EXTENSIONS = new Set(["pdf", "csv", "txt", "doc", "docx", "xls", "xlsx", "zip"]);

export function resolveAttachmentKind(name: string, mimeType?: string): "image" | "file" | null {
  const ext = getExtension(name);
  if (ext && BLOCKED_EXTENSIONS.has(ext)) return null;

  if (mimeType && IMAGE_TYPES.has(mimeType)) return "image";
  if (mimeType && FILE_TYPES.has(mimeType)) return "file";
  if (ext && IMAGE_EXTENSIONS.has(ext)) return "image";
  if (ext && FILE_EXTENSIONS.has(ext)) return "file";

  return null;
}

export function assertAttachmentEligible(
  name: string,
  mimeType: string,
  size: number
): "image" | "file" {
  const kind = resolveAttachmentKind(name, mimeType);
  if (!kind) {
    throw new Error(
      "Tipe file tidak didukung untuk lampiran. Gunakan gambar, PDF, CSV, TXT, DOC/XLS, atau ZIP."
    );
  }

  const maxBytes = kind === "image" ? MAX_IMAGE_BYTES : MAX_FILE_BYTES;
  if (size > maxBytes) {
    const limitMb = maxBytes / (1024 * 1024);
    throw new Error(`Ukuran file maksimal ${limitMb} MB (${kind === "image" ? "gambar" : "dokumen"}).`);
  }

  return kind;
}

export function resolveMimeType(name: string, mimeType?: string): string {
  if (mimeType && mimeType !== "application/octet-stream") return mimeType;
  const ext = getExtension(name);
  return ext ? guessMimeType(ext) : "application/octet-stream";
}
