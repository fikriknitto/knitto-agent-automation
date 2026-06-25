import type { StorageEntry, StorageSummary } from "@knitto/shared";

export type ListEntriesResult = {
  path: string;
  entries: StorageEntry[];
  summary: StorageSummary;
};

export type UploadFileInput = {
  buffer: Buffer;
  originalName: string;
  mimeType?: string;
};

export type FileContentResult = {
  path: string;
  name: string;
  mimeType: string;
  size: number;
  data: string;
  kind: "image" | "file";
};

export type FileServeResult = {
  buffer: Buffer;
  mimeType: string;
  name: string;
  size: number;
};

export interface StorageAdapter {
  list(relativePath: string): Promise<ListEntriesResult>;
  upload(relativePath: string, files: UploadFileInput[]): Promise<StorageEntry[]>;
  createFolder(relativePath: string, name: string): Promise<StorageEntry>;
  readFileContent(relativePath: string): Promise<FileContentResult>;
  serveFile(relativePath: string): Promise<FileServeResult>;
  rename(relativePath: string, newName: string): Promise<StorageEntry>;
  delete(relativePath: string): Promise<void>;
}
