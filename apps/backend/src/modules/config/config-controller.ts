import type { Request, Response } from "express";

export class ConfigController {
  getPublic(_req: Request, res: Response): void {
    res.json({
      wsPath: "/ws",
      strategies: [{ id: "browser_human_strategy", label: "Human-like browse" }],
      viewport: {
        width: Number(process.env.AUTOMATION_VIEWPORT_WIDTH ?? 1280),
        height: Number(process.env.AUTOMATION_VIEWPORT_HEIGHT ?? 720),
      },
    });
  }
}
