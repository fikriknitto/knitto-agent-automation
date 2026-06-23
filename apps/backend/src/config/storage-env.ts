import { z } from "zod";

const storageEnvSchema = z.object({
  STORAGE_DRIVER: z.enum(["local", "minio"]).default("local"),
  STORAGE_ROOT: z.string().default("./storage"),
  STORAGE_MAX_UPLOAD_BYTES: z.coerce.number().default(52_428_800),
  MINIO_ENDPOINT: z.string().optional(),
  MINIO_PORT: z.coerce.number().optional(),
  MINIO_USE_SSL: z
    .string()
    .optional()
    .transform((v) => v === "1" || v === "true"),
  MINIO_ACCESS_KEY: z.string().optional(),
  MINIO_SECRET_KEY: z.string().optional(),
  MINIO_BUCKET: z.string().optional(),
  MINIO_REGION: z.string().default("us-east-1"),
});

export type StorageEnv = z.infer<typeof storageEnvSchema>;

let cached: StorageEnv | undefined;

export function loadStorageEnv(): StorageEnv {
  if (!cached) {
    cached = storageEnvSchema.parse(process.env);
  }
  return cached;
}
