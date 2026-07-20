import type { StorageEntry } from "@knitto/shared";
import { mkdir, readdir, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { resolveStorageRoot } from "../../config/paths.js";
import { loadStorageEnv } from "../../config/storage-env.js";
import {
  assertAttachmentEligible,
  assertStorageFileReadable,
  isBlockedExtension,
  resolveMimeType,
} from "./attachment-eligibility.js";
import {
  getExtension,
  guessMimeType,
  joinRelativePath,
  normalizeRelativePath,
  resolveSafePath,
  sanitizeEntryName,
  StoragePathError,
} from "./path-utils.js";
import type { FileContentResult, FileServeResult, ListEntriesResult, StorageAdapter, UploadFileInput } from "./storage-adapter.interface.js";

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
    if (normalized === "agents" || normalized.startsWith("agents/")) {
      throw new StoragePathError("Reserved path: agents (Worker evidence workspace)");
    }
    const absolute = resolveSafePath(this.root, normalized);

    await mkdir(absolute, { recursive: true });

    const dirents = await readdir(absolute, { withFileTypes: true });
    const entries: StorageEntry[] = [];
    let totalBytes = 0;

    for (const dirent of dirents) {
      // Reserved: Worker job evidence workspace (not part of Media library / file manager).
      if (!normalized && (dirent.name === "agents" || dirent.name === ".agents")) {
        continue;
      }
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
      if (isBlockedExtension(safeName)) {
        throw new Error(`Tipe file tidak diizinkan: ${safeName}`);
      }
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

  async serveFile(relativePath: string): Promise<FileServeResult> {
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
    const env = loadStorageEnv();
    assertStorageFileReadable(name, stats.size, env.STORAGE_MAX_UPLOAD_BYTES);

    const mimeType = resolveMimeType(name, guessMimeType(getExtension(name)));
    const buffer = await readFile(absolute);

    return { buffer, mimeType, name, size: stats.size };
  }

  async rename(relativePath: string, newName: string): Promise<StorageEntry> {
    const normalized = normalizeRelativePath(relativePath);
    if (!normalized) {
      throw new Error("Path is required");
    }

    const safeName = sanitizeEntryName(newName);
    const parent = normalized.includes("/")
      ? normalized.slice(0, normalized.lastIndexOf("/"))
      : "";
    const newPath = joinRelativePath(parent, safeName);

    if (newPath === normalized) {
      const absolute = resolveSafePath(this.root, normalized);
      const stats = await stat(absolute);
      const type = stats.isDirectory() ? "folder" : "file";
      return toEntry(normalized, type, stats);
    }

    const absoluteOld = resolveSafePath(this.root, normalized);
    const absoluteNew = resolveSafePath(this.root, newPath);
    const stats = await stat(absoluteOld);
    const type = stats.isDirectory() ? "folder" : "file";

    if (type === "file" && isBlockedExtension(safeName)) {
      throw new Error(`Tipe file tidak diizinkan: ${safeName}`);
    }

    await rename(absoluteOld, absoluteNew);
    const newStats = await stat(absoluteNew);
    return toEntry(newPath, type, newStats);
  }

  async delete(relativePath: string): Promise<void> {
    const normalized = normalizeRelativePath(relativePath);
    if (!normalized) {
      throw new Error("Path is required");
    }

    const absolute = resolveSafePath(this.root, normalized);
    await rm(absolute, { recursive: true, force: true });
  }
}

