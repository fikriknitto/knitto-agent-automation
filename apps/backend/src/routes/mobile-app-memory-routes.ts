import { Router } from "express";
import { MobileAppMemoryController } from "../controllers/mobile-app-memory-controller.js";

export function createMobileAppMemoryRoutes(): Router {
  const router = Router();
  const controller = new MobileAppMemoryController();

  router.get("/mobile/app-memory", (req, res) => void controller.list(req, res));
  router.get("/mobile/app-memory/:appId", (req, res) => void controller.get(req, res));
  router.post("/mobile/app-memory", (req, res) => void controller.create(req, res));
  router.put("/mobile/app-memory/:appId", (req, res) => void controller.update(req, res));
  router.delete("/mobile/app-memory/:appId", (req, res) => void controller.remove(req, res));

  return router;
}
