import { Router } from "express";
import { BridgeController } from "../controllers/bridge-controller.js";

export function createBridgeRoutes(getBridges: () => unknown[]): Router {
  const router = Router();
  const controller = new BridgeController(getBridges);

  router.get("/bridges", (req, res) => controller.list(req, res));

  return router;
}
