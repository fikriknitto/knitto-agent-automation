import { Router } from "express";
import { MobileDeviceController } from "./mobile-device-controller.js";

export function createMobileDeviceRoutes(): Router {
  const router = Router();
  const controller = new MobileDeviceController();

  router.get("/mobile/devices", (req, res) => void controller.list(req, res));
  router.get("/mobile/devices/stream", (req, res) => void controller.stream(req, res));
  router.get("/mobile/devices/:udid/packages", (req, res) =>
    void controller.listPackages(req, res)
  );
  router.get("/mobile/devices/:udid/packages/:pkg/activity", (req, res) =>
    void controller.resolveActivity(req, res)
  );

  return router;
}
