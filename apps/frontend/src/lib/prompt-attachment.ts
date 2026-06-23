export type PromptAttachment = {
  data: string;
  mimeType: string;
  name: string;
  kind: "image" | "file";
  /** Relative path inside storage/ when picked from file manager */
  storagePath?: string;
};

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

const EXT_TO_MIME: Record<string, string> = {
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
};

export const ACCEPTED_FILE_INPUT =
  "image/png,image/jpeg,image/webp,image/gif," +
  "application/pdf,text/csv,text/plain," +
  "application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document," +
  "application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet," +
  "application/zip,.pdf,.csv,.txt,.doc,.docx,.xls,.xlsx,.zip";

function fileExtension(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot >= 0 ? name.slice(dot + 1).toLowerCase() : "";
}

function isBlockedExtension(name: string): boolean {
  const ext = fileExtension(name);
  return ext ? BLOCKED_EXTENSIONS.has(ext) : false;
}

function resolveKindFromMeta(name: string, mimeType?: string): "image" | "file" | null {
  if (isBlockedExtension(name)) return null;

  if (mimeType && IMAGE_TYPES.has(mimeType)) return "image";
  if (mimeType && FILE_TYPES.has(mimeType)) return "file";

  const ext = fileExtension(name);
  if (!ext) return null;
  if (BLOCKED_EXTENSIONS.has(ext)) return null;
  if (["png", "jpg", "jpeg", "webp", "gif"].includes(ext)) return "image";
  if (["pdf", "csv", "txt", "doc", "docx", "xls", "xlsx", "zip"].includes(ext)) return "file";

  return null;
}

function resolveKind(file: File): "image" | "file" | null {
  if (isBlockedExtension(file.name)) return null;
  if (file.type && IMAGE_TYPES.has(file.type)) return "image";
  if (file.type && FILE_TYPES.has(file.type)) return "file";
  return resolveKindFromMeta(file.name, file.type);
}

export function isAcceptedStorageEntry(name: string, mimeType?: string): boolean {
  return resolveKindFromMeta(name, mimeType) !== null;
}

export function isAcceptedAttachment(file: File): boolean {
  return resolveKind(file) !== null;
}

export function isPasteableImage(file: File): boolean {
  return resolveKind(file) === "image";
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("Gagal membaca file"));
        return;
      }
      const comma = result.indexOf(",");
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(reader.error ?? new Error("Gagal membaca file"));
    reader.readAsDataURL(file);
  });
}

export async function fileToPromptAttachment(file: File): Promise<PromptAttachment> {
  const kind = resolveKind(file);
  if (!kind) {
    throw new Error(
      "Tipe file tidak didukung. Gunakan gambar (PNG/JPEG/WebP/GIF), PDF, CSV, TXT, DOC/XLS, atau ZIP."
    );
  }

  const maxBytes = kind === "image" ? MAX_IMAGE_BYTES : MAX_FILE_BYTES;
  if (file.size > maxBytes) {
    const limitMb = maxBytes / (1024 * 1024);
    throw new Error(`Ukuran file maksimal ${limitMb} MB (${kind === "image" ? "gambar" : "dokumen"}).`);
  }

  const data = await readFileAsBase64(file);
  const ext = fileExtension(file.name);
  const mimeType =
    file.type ||
    (ext ? EXT_TO_MIME[ext] : undefined) ||
    (kind === "image" ? "image/png" : "application/octet-stream");

  return {
    data,
    mimeType,
    name: file.name || (kind === "image" ? "image.png" : "file.bin"),
    kind,
  };
}

export async function filesToPromptAttachments(
  files: FileList | File[]
): Promise<PromptAttachment[]> {
  const list = Array.from(files).filter(isAcceptedAttachment);
  return Promise.all(list.map(fileToPromptAttachment));
}

export function promptAttachmentImageSrc(attachment: PromptAttachment): string {
  return `data:${attachment.mimeType};base64,${attachment.data}`;
}

export function promptAttachmentTitle(attachment: PromptAttachment): string {
  if (attachment.storagePath) {
    return `${attachment.name} (storage/${attachment.storagePath})`;
  }
  return attachment.name;
}

export function fileContentToPromptAttachment(content: {
  path: string;
  name: string;
  mimeType: string;
  size: number;
  data: string;
  kind: "image" | "file";
}): PromptAttachment {
  const kind = resolveKindFromMeta(content.name, content.mimeType);
  if (!kind) {
    throw new Error(
      "Tipe file tidak didukung. Gunakan gambar (PNG/JPEG/WebP/GIF), PDF, CSV, TXT, DOC/XLS, atau ZIP."
    );
  }

  const maxBytes = kind === "image" ? MAX_IMAGE_BYTES : MAX_FILE_BYTES;
  if (content.size > maxBytes) {
    const limitMb = maxBytes / (1024 * 1024);
    throw new Error(`Ukuran file maksimal ${limitMb} MB (${kind === "image" ? "gambar" : "dokumen"}).`);
  }

  return {
    data: content.data,
    mimeType: content.mimeType,
    name: content.name,
    kind: content.kind,
    storagePath: content.path,
  };
}

export function attachmentExtension(name: string): string {
  const ext = fileExtension(name);
  return ext ? ext.toUpperCase() : "FILE";
}

export function formatAttachmentSummary(attachments: PromptAttachment[]): string {
  if (!attachments.length) return "";
  const images = attachments.filter((a) => a.kind === "image").length;
  const files = attachments.filter((a) => a.kind === "file").length;
  const parts: string[] = [];
  if (images) parts.push(`${images} gambar`);
  if (files) parts.push(`${files} file`);
  return `[${attachments.length} lampiran: ${parts.join(", ")}]`;
}
