import { LocalStorageAdapter } from "./local-storage-adapter.js";
import type { StorageAdapter } from "./storage-adapter.interface.js";

let adapter: StorageAdapter | undefined;

export function createStorageAdapter(): StorageAdapter {
  return new LocalStorageAdapter();
}

export function getStorageAdapter(): StorageAdapter {
  if (!adapter) {
    adapter = createStorageAdapter();
  }
  return adapter;
}
