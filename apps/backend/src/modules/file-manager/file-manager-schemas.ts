import { createFolderBodySchema } from "@knitto/shared";
import { z } from "zod";

export const listEntriesQuerySchema = z.object({
  path: z.string().optional().default(""),
});

export const fileContentQuerySchema = z.object({
  path: z.string().min(1),
});

export { createFolderBodySchema };

export type ListEntriesQuery = z.infer<typeof listEntriesQuerySchema>;
