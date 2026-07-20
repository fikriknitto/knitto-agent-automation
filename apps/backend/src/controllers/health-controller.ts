import type { Request, Response } from "express";
import { getBrowserLockSnapshot } from "../services/shared/browser-lock.js";
import { hostJobGate } from "../services/shared/host-job-gate.js";

export class HealthController {
  get(_req: Request, res: Response): void {
    res.json({
      status: "ok",
      service: "knitto-backend",
      hostJob: {
        busy: hostJobGate.isBusy(),
        activeJobId: hostJobGate.getActiveJobId(),
      },
      browserLock: getBrowserLockSnapshot(),
    });
  }
}
