import { resolveMobileMemoryDir } from "../../../config/paths.js";
import { createAppMemoryStore } from "../../../services/shared/app-memory-store.js";

const store = createAppMemoryStore(resolveMobileMemoryDir());

export const sanitizeAppId = store.sanitizeAppId;
export const listAppMemories = store.listAppMemories;
export const readAppMemory = store.readAppMemory;
export const writeAppMemory = store.writeAppMemory;
export const deleteAppMemory = store.deleteAppMemory;
