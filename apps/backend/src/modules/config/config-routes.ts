import { Router } from "express";
import { ConfigController } from "./config-controller.js";

export function createConfigRoutes(): Router {
  const router = Router();
  const controller = new ConfigController();

  router.get("/config/public", (req, res) => controller.getPublic(req, res));

  return router;
}
