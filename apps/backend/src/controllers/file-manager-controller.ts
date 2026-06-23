import type { Request, Response } from "express";
import { createFolderBodySchema } from "@knitto/shared";
import { z } from "zod";
import {
  FileManagerService,
  isStoragePathError,
} from "../services/storage/file-manager-service.js";
import { listEntriesQuerySchema, fileContentQuerySchema } from "../validators/file-manager-schemas.js";
import { loadStorageEnv } from "../config/storage-env.js";

export class FileManagerController {
  private readonly service = new FileManagerService();

  async listEntries(req: Request, res: Response): Promise<void> {
    try {
      const query = listEntriesQuerySchema.parse(req.query);
      const result = await this.service.listEntries(query.path);
      res.json(result);
    } catch (error) {
      this.handleError(res, error, "Failed to list storage entries");
    }
  }

  async upload(req: Request, res: Response): Promise<void> {
    try {
      const path = typeof req.body?.path === "string" ? req.body.path : "";
      const files = req.files;
      if (!Array.isArray(files) || files.length === 0) {
        res.status(400).json({ error: "At least one file is required" });
        return;
      }

      const env = loadStorageEnv();
      const uploads = files.map((file) => {
        if (file.size > env.STORAGE_MAX_UPLOAD_BYTES) {
          throw new Error(`File ${file.originalname} exceeds upload size limit`);
        }
        return {
          buffer: file.buffer,
          originalName: file.originalname,
          mimeType: file.mimetype,
        };
      });

      const entries = await this.service.uploadFiles(path, uploads);
      res.status(201).json({ path, entries });
    } catch (error) {
      this.handleError(res, error, "Failed to upload files");
    }
  }

  async createFolder(req: Request, res: Response): Promise<void> {
    try {
      const body = createFolderBodySchema.parse(req.body);
      const entry = await this.service.createFolder(body.path, body.name);
      res.status(201).json({ entry });
    } catch (error) {
      this.handleError(res, error, "Failed to create folder");
    }
  }

  async getFileContent(req: Request, res: Response): Promise<void> {
    try {
      const query = fileContentQuerySchema.parse(req.query);
      const result = await this.service.readFileContent(query.path);
      res.json(result);
    } catch (error) {
      if (isStoragePathError(error) || error instanceof Error) {
        res.status(400).json({
          error: error instanceof Error ? error.message : "Failed to read file content",
        });
        return;
      }
      this.handleError(res, error, "Failed to read file content");
    }
  }

  private handleError(res: Response, error: unknown, fallback: string): void {
    if (isStoragePathError(error)) {
      res.status(400).json({ error: error.message });
      return;
    }
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Invalid request" });
      return;
    }
    res.status(500).json({
      error: error instanceof Error ? error.message : fallback,
    });
  }
}
