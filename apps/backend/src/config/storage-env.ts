import { z } from "zod";

const storageEnvSchema = z.object({
  STORAGE_ROOT: z.string().default("./storage"),
  STORAGE_MAX_UPLOAD_BYTES: z.coerce.number().default(52_428_800),
});

export type StorageEnv = z.infer<typeof storageEnvSchema>;

let cached: StorageEnv | undefined;

export function loadStorageEnv(): StorageEnv {
  if (!cached) {
    cached = storageEnvSchema.parse(process.env);
  }
  return cached;
}
