import { statSync } from "node:fs";
import { resolveMobileMemoryDir } from "../../config/paths.js";
import { createAppMemoryStore } from "../../core/memory/app-memory-store.js";
import type {
  CreateAppMemoryBody,
  UpdateAppMemoryBody,
} from "./app-memory-schemas.js";

const store = createAppMemoryStore(resolveMobileMemoryDir());

export type AppMemoryDto = {
  appId: string;
  content: string;
  updatedAt: string;
  sizeBytes: number;
  preview: string;
};

export type AppMemorySummaryDto = {
  appId: string;
  updatedAt: string;
  sizeBytes: number;
  preview: string;
};

export class AppMemoryNotFoundError extends Error {
  constructor(appId: string) {
    super(`App memory not found: ${appId}`);
    this.name = "AppMemoryNotFoundError";
  }
}

export class AppMemoryConflictError extends Error {
  constructor(appId: string) {
    super(`App memory already exists: ${appId}`);
    this.name = "AppMemoryConflictError";
  }
}

function toDto(record: ReturnType<typeof store.readAppMemory>): AppMemoryDto {
  const stat = statSync(record.path);
  const preview =
    record.content
      .replace(/\r\n/g, "\n")
      .split("\n")
      .map((line) => line.trim())
      .find((line) => line.length > 0)
      ?.slice(0, 120) ?? "";

  return {
    appId: record.appId,
    content: record.content,
    updatedAt: stat.mtime.toISOString(),
    sizeBytes: stat.size,
    preview,
  };
}

export function listMobileAppMemorySummaries(): AppMemorySummaryDto[] {
  return store.listAppMemories();
}

export function getMobileAppMemory(appId: string): AppMemoryDto {
  const record = store.readAppMemory(appId);
  if (!record.exists) {
    throw new AppMemoryNotFoundError(store.sanitizeAppId(appId));
  }
  return toDto(record);
}

export function createMobileAppMemory(body: CreateAppMemoryBody): AppMemoryDto {
  const safeId = store.sanitizeAppId(body.appId);
  const existing = store.readAppMemory(safeId);
  if (existing.exists) {
    throw new AppMemoryConflictError(safeId);
  }
  store.writeAppMemory(safeId, body.content, "replace");
  return getMobileAppMemory(safeId);
}

export function updateMobileAppMemory(
  appId: string,
  body: UpdateAppMemoryBody
): AppMemoryDto {
  const safeId = store.sanitizeAppId(appId);
  const existing = store.readAppMemory(safeId);
  if (!existing.exists) {
    throw new AppMemoryNotFoundError(safeId);
  }
  store.writeAppMemory(safeId, body.content, "replace");
  return getMobileAppMemory(safeId);
}

export function removeMobileAppMemory(appId: string): void {
  const safeId = store.sanitizeAppId(appId);
  const existing = store.readAppMemory(safeId);
  if (!existing.exists) {
    throw new AppMemoryNotFoundError(safeId);
  }
  store.deleteAppMemory(safeId);
}
