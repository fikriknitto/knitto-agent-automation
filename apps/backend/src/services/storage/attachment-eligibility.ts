import { getExtension, guessMimeType } from "./path-utils.js";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_FILE_BYTES = 10 * 1024 * 1024;

const IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml"]);
const IMAGE_EXTENSIONS = new Set(["png", "jpg", "jpeg", "webp", "gif", "svg", "bmp"]);

/** Executable / script types — never allowed in storage attachments */
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
  "vbs",
  "js",
  "mjs",
  "cjs",
  "jar",
  "app",
  "deb",
  "rpm",
]);

export function isBlockedExtension(name: string): boolean {
  const ext = getExtension(name);
  return ext ? BLOCKED_EXTENSIONS.has(ext) : false;
}

export function resolveAttachmentKind(name: string, mimeType?: string): "image" | "file" | null {
  if (isBlockedExtension(name)) return null;

  if (mimeType && IMAGE_TYPES.has(mimeType)) return "image";
  if (mimeType?.startsWith("image/")) return "image";

  const ext = getExtension(name);
  if (ext && IMAGE_EXTENSIONS.has(ext)) return "image";

  // Any other non-blocked file with an extension is a generic file attachment
  if (ext) return "file";

  if (mimeType && mimeType !== "application/octet-stream") return "file";

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
      "Tipe file tidak didukung untuk lampiran. File harus punya ekstensi yang dikenali dan bukan executable."
    );
  }

  const maxBytes = kind === "image" ? MAX_IMAGE_BYTES : MAX_FILE_BYTES;
  if (size > maxBytes) {
    const limitMb = maxBytes / (1024 * 1024);
    throw new Error(`Ukuran file maksimal ${limitMb} MB (${kind === "image" ? "gambar" : "dokumen"}).`);
  }

  return kind;
}

export function assertStorageFileReadable(name: string, size: number, maxBytes: number): void {
  if (isBlockedExtension(name)) {
    throw new Error("Tipe file tidak diizinkan di storage");
  }
  if (size > maxBytes) {
    const limitMb = maxBytes / (1024 * 1024);
    throw new Error(`Ukuran file melebihi batas storage (${limitMb} MB)`);
  }
}

export function resolveMimeType(name: string, mimeType?: string): string {
  if (mimeType && mimeType !== "application/octet-stream") return mimeType;
  const ext = getExtension(name);
  return ext ? guessMimeType(ext) : "application/octet-stream";
}
