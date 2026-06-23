import { resolve, sep } from "node:path";

const INVALID_SEGMENT = /^(?:\.\.+|)$/;

export class StoragePathError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StoragePathError";
  }
}

export function normalizeRelativePath(input: string): string {
  const raw = input.trim().replace(/\\/g, "/").replace(/^\/+/, "");
  if (!raw) return "";

  const segments = raw.split("/").filter((segment) => segment.length > 0);
  for (const segment of segments) {
    if (INVALID_SEGMENT.test(segment) || segment.includes("\0")) {
      throw new StoragePathError("Invalid storage path");
    }
  }

  return segments.join("/");
}

export function resolveSafePath(root: string, relativePath: string): string {
  const normalized = normalizeRelativePath(relativePath);
  const rootResolved = resolve(root);
  const absolute = resolve(rootResolved, normalized || ".");

  if (absolute !== rootResolved && !absolute.startsWith(`${rootResolved}${sep}`)) {
    throw new StoragePathError("Path escapes storage root");
  }

  return absolute;
}

export function sanitizeEntryName(name: string): string {
  const trimmed = name.trim().replace(/\\/g, "/");
  const base = trimmed.split("/").pop() ?? "";
  if (!base || base === "." || base === ".." || base.includes("\0")) {
    throw new StoragePathError("Invalid file or folder name");
  }
  return base;
}

export function joinRelativePath(parent: string, name: string): string {
  const parentNorm = normalizeRelativePath(parent);
  const safeName = sanitizeEntryName(name);
  return parentNorm ? `${parentNorm}/${safeName}` : safeName;
}

export function getExtension(name: string): string {
  const idx = name.lastIndexOf(".");
  if (idx <= 0) return "";
  return name.slice(idx + 1).toLowerCase();
}

export function guessMimeType(extension: string): string {
  const map: Record<string, string> = {
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    webp: "image/webp",
    gif: "image/gif",
    pdf: "application/pdf",
    csv: "text/csv",
    txt: "text/plain",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    zip: "application/zip",
    mp3: "audio/mpeg",
    mp4: "video/mp4",
  };
  return map[extension] ?? "application/octet-stream";
}
