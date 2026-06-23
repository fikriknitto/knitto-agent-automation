import { z } from "zod";

export const storageEntryTypeSchema = z.enum(["file", "folder"]);

export const storageEntrySchema = z.object({
  id: z.string(),
  name: z.string(),
  type: storageEntryTypeSchema,
  mimeType: z.string().optional(),
  extension: z.string().optional(),
  size: z.number().optional(),
  updatedAt: z.string(),
  path: z.string(),
});

export const storageSummarySchema = z.object({
  itemCount: z.number(),
  totalBytes: z.number(),
});

export const listEntriesResponseSchema = z.object({
  path: z.string(),
  entries: z.array(storageEntrySchema),
  summary: storageSummarySchema,
});

export const createFolderBodySchema = z.object({
  path: z.string().default(""),
  name: z.string().min(1),
});

export const uploadResponseSchema = z.object({
  path: z.string(),
  entries: z.array(storageEntrySchema),
});

export const fileContentResponseSchema = z.object({
  path: z.string(),
  name: z.string(),
  mimeType: z.string(),
  size: z.number(),
  data: z.string(),
  kind: z.enum(["image", "file"]),
});

export type StorageEntryType = z.infer<typeof storageEntryTypeSchema>;
export type StorageEntry = z.infer<typeof storageEntrySchema>;
export type StorageSummary = z.infer<typeof storageSummarySchema>;
export type ListEntriesResponse = z.infer<typeof listEntriesResponseSchema>;
export type CreateFolderBody = z.infer<typeof createFolderBodySchema>;
export type UploadResponse = z.infer<typeof uploadResponseSchema>;
export type FileContentResponse = z.infer<typeof fileContentResponseSchema>;
