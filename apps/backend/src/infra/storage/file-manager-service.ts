import type { StorageEntry } from "@knitto/shared";
import { getStorageAdapter } from "./storage-factory.js";
import type {
  FileContentResult,
  ListEntriesResult,
  UploadFileInput,
} from "./storage-adapter.interface.js";
import { StoragePathError } from "./path-utils.js";

export class FileManagerService {
  private readonly adapter = getStorageAdapter();

  listEntries(path: string): Promise<ListEntriesResult> {
    return this.adapter.list(path);
  }

  uploadFiles(path: string, files: UploadFileInput[]): Promise<StorageEntry[]> {
    return this.adapter.upload(path, files);
  }

  createFolder(path: string, name: string): Promise<StorageEntry> {
    return this.adapter.createFolder(path, name);
  }

  readFileContent(path: string): Promise<FileContentResult> {
    return this.adapter.readFileContent(path);
  }

  serveFile(path: string) {
    return this.adapter.serveFile(path);
  }

  renameEntry(path: string, name: string): Promise<StorageEntry> {
    return this.adapter.rename(path, name);
  }

  deleteEntry(path: string): Promise<void> {
    return this.adapter.delete(path);
  }
}

export function isStoragePathError(error: unknown): error is StoragePathError {
  return error instanceof StoragePathError;
}
