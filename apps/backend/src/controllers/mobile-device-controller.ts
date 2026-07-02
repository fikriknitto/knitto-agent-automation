import type { Request, Response } from "express";
import { z } from "zod";
import {
  getDevicesSnapshot,
  listDevicePackages,
  resolvePackageActivity,
} from "../services/mobile-device-service.js";
import {
  mobileDeviceParamsSchema,
  mobilePackageParamsSchema,
  mobilePackagesQuerySchema,
} from "../validators/mobile-device-schemas.js";

const SSE_INTERVAL_MS = 3000;

export class MobileDeviceController {
  async list(_req: Request, res: Response): Promise<void> {
    try {
      const snapshot = await getDevicesSnapshot();
      res.json(snapshot);
    } catch (error) {
      this.handleError(res, error, "Failed to list mobile devices");
    }
  }

  async stream(req: Request, res: Response): Promise<void> {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const send = async (): Promise<void> => {
      const snapshot = await getDevicesSnapshot();
      res.write(`data: ${JSON.stringify(snapshot)}\n\n`);
    };

    await send();
    const interval = setInterval(() => {
      void send();
    }, SSE_INTERVAL_MS);

    req.on("close", () => {
      clearInterval(interval);
    });
  }

  async listPackages(req: Request, res: Response): Promise<void> {
    try {
      const { udid } = mobileDeviceParamsSchema.parse(req.params);
      const { q } = mobilePackagesQuerySchema.parse(req.query);
      const packages = await listDevicePackages(udid, q);
      res.json({ packages });
    } catch (error) {
      this.handleError(res, error, "Failed to list packages");
    }
  }

  async resolveActivity(req: Request, res: Response): Promise<void> {
    try {
      const { udid, pkg } = mobilePackageParamsSchema.parse(req.params);
      const result = await resolvePackageActivity(udid, pkg);
      res.json(result);
    } catch (error) {
      this.handleError(res, error, "Failed to resolve activity");
    }
  }

  private handleError(res: Response, error: unknown, fallback: string): void {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.flatten().fieldErrors });
      return;
    }
    const message = error instanceof Error ? error.message : fallback;
    res.status(500).json({ error: message });
  }
}
