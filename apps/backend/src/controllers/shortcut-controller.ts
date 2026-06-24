import type { Request, Response } from "express";
import { listPromptShortcuts } from "../services/shortcut-service.js";

export class ShortcutController {
  async list(_req: Request, res: Response): Promise<void> {
    try {
      const shortcuts = await listPromptShortcuts();
      console.log(shortcuts);
      res.json({ shortcuts });
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to load shortcuts",
      });
    }
  }
}
