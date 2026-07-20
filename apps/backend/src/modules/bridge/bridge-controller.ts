import type { Request, Response } from "express";

export class BridgeController {
  constructor(private readonly getBridges: () => unknown[]) {}

  list(_req: Request, res: Response): void {
    res.json({ bridges: this.getBridges() });
  }
}
