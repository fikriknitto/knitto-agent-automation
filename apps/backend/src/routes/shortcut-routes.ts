import { Router } from "express";
import { ShortcutController } from "../controllers/shortcut-controller.js";

export function createShortcutRoutes(): Router {
  const router = Router();
  const controller = new ShortcutController();

  router.get("/shortcuts", (req, res) => void controller.list(req, res));

  return router;
}
