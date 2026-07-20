import { createFolderBodySchema, deleteEntryBodySchema, renameEntryBodySchema } from "@knitto/shared";
import type { Request, Response } from "express";
import { z } from "zod";
import { loadStorageEnv } from "../../config/storage-env.js";
import {
  FileManagerService,
  isStoragePathError,
} from "../../infra/storage/file-manager-service.js";
import { fileContentQuerySchema, listEntriesQuerySchema } from "./file-manager-schemas.js";

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

  async renameEntry(req: Request, res: Response): Promise<void> {
    try {
      const body = renameEntryBodySchema.parse(req.body);
      const entry = await this.service.renameEntry(body.path, body.name);
      res.json({ entry });
    } catch (error) {
      this.handleError(res, error, "Failed to rename entry");
    }
  }

  async deleteEntry(req: Request, res: Response): Promise<void> {
    try {
      const body = deleteEntryBodySchema.parse(req.body);
      await this.service.deleteEntry(body.path);
      res.status(204).send();
    } catch (error) {
      this.handleError(res, error, "Failed to delete entry");
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

  async serveFile(req: Request, res: Response): Promise<void> {
    try {
      const query = fileContentQuerySchema.parse(req.query);
      const result = await this.service.serveFile(query.path);
      res.setHeader("Content-Type", result.mimeType);
      res.setHeader("Cache-Control", "private, max-age=3600");
      res.send(result.buffer);
    } catch (error) {
      if (isStoragePathError(error) || error instanceof Error) {
        res.status(400).json({
          error: error instanceof Error ? error.message : "Failed to serve file",
        });
        return;
      }
      this.handleError(res, error, "Failed to serve file");
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
