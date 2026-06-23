import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { StorageEntry } from "@knitto/shared";
import { resolveStorageRoot } from "../../config/paths.js";
import {
  getExtension,
  guessMimeType,
  joinRelativePath,
  normalizeRelativePath,
  resolveSafePath,
  sanitizeEntryName,
} from "./path-utils.js";
import type { ListEntriesResult, StorageAdapter, UploadFileInput, FileContentResult } from "./storage-adapter.interface.js";
import {
  assertAttachmentEligible,
  resolveMimeType,
} from "./attachment-eligibility.js";

function toEntry(relativePath: string, type: "file" | "folder", stats: {
  size: number;
  mtime: Date;
}): StorageEntry {
  const name = relativePath.split("/").pop() ?? relativePath;
  const extension = type === "file" ? getExtension(name) : undefined;
  return {
    id: relativePath,
    name,
    type,
    path: relativePath,
    size: type === "file" ? stats.size : undefined,
    extension,
    mimeType: type === "file" && extension ? guessMimeType(extension) : undefined,
    updatedAt: stats.mtime.toISOString(),
  };
}

export class LocalStorageAdapter implements StorageAdapter {
  constructor(private readonly root = resolveStorageRoot()) {}

  async list(relativePath: string): Promise<ListEntriesResult> {
    const normalized = normalizeRelativePath(relativePath);
    const absolute = resolveSafePath(this.root, normalized);

    await mkdir(absolute, { recursive: true });

    const dirents = await readdir(absolute, { withFileTypes: true });
    const entries: StorageEntry[] = [];
    let totalBytes = 0;

    for (const dirent of dirents) {
      const entryPath = normalized ? `${normalized}/${dirent.name}` : dirent.name;
      const entryAbsolute = join(absolute, dirent.name);
      const stats = await stat(entryAbsolute);
      const type = dirent.isDirectory() ? "folder" : "file";
      entries.push(toEntry(entryPath, type, stats));
      if (type === "file") totalBytes += stats.size;
    }

    entries.sort((a, b) => {
      if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

    return {
      path: normalized,
      entries,
      summary: {
        itemCount: entries.length,
        totalBytes,
      },
    };
  }

  async upload(relativePath: string, files: UploadFileInput[]): Promise<StorageEntry[]> {
    const normalized = normalizeRelativePath(relativePath);
    const absoluteDir = resolveSafePath(this.root, normalized);
    await mkdir(absoluteDir, { recursive: true });

    const created: StorageEntry[] = [];

    for (const file of files) {
      const safeName = sanitizeEntryName(file.originalName);
      const entryPath = joinRelativePath(normalized, safeName);
      const absoluteFile = resolveSafePath(this.root, entryPath);
      await writeFile(absoluteFile, file.buffer);
      const stats = await stat(absoluteFile);
      created.push(toEntry(entryPath, "file", stats));
    }

    return created;
  }

  async createFolder(relativePath: string, name: string): Promise<StorageEntry> {
    const safeName = sanitizeEntryName(name);
    const folderPath = joinRelativePath(relativePath, safeName);
    const absolute = resolveSafePath(this.root, folderPath);
    await mkdir(absolute, { recursive: true });
    const stats = await stat(absolute);
    return toEntry(folderPath, "folder", stats);
  }

  async readFileContent(relativePath: string): Promise<FileContentResult> {
    const normalized = normalizeRelativePath(relativePath);
    if (!normalized) {
      throw new Error("File path is required");
    }

    const absolute = resolveSafePath(this.root, normalized);
    const stats = await stat(absolute);
    if (!stats.isFile()) {
      throw new Error("Path is not a file");
    }

    const name = normalized.split("/").pop() ?? normalized;
    const mimeType = resolveMimeType(name, guessMimeType(getExtension(name)));
    const kind = assertAttachmentEligible(name, mimeType, stats.size);
    const buffer = await readFile(absolute);

    return {
      path: normalized,
      name,
      mimeType,
      size: stats.size,
      data: buffer.toString("base64"),
      kind,
    };
  }
}

