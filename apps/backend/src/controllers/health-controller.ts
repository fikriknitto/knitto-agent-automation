import type { Request, Response } from "express";

export class HealthController {
  get(_req: Request, res: Response): void {
    res.json({ status: "ok", service: "knitto-backend" });
  }
}
