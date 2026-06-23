import { loadStorageEnv } from "../../config/storage-env.js";
import { LocalStorageAdapter } from "./local-storage-adapter.js";
import type { StorageAdapter } from "./storage-adapter.interface.js";

let adapter: StorageAdapter | undefined;

export function createStorageAdapter(): StorageAdapter {
  const env = loadStorageEnv();

  if (env.STORAGE_DRIVER === "minio") {
    throw new Error("STORAGE_DRIVER=minio is not implemented yet (phase 4)");
  }

  return new LocalStorageAdapter();
}

export function getStorageAdapter(): StorageAdapter {
  if (!adapter) {
    adapter = createStorageAdapter();
  }
  return adapter;
}
