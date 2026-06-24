import { Router } from "express";
import type { BridgeRegistryService } from "../services/bridge-registry.service.js";
import { createAgentScreenshotRoutes } from "./agent-screenshot-routes.js";
import { createBridgeRoutes } from "./bridge-routes.js";
import { createConfigRoutes } from "./config-routes.js";
import { createFileManagerRoutes } from "./file-manager-routes.js";
import { createHealthRoutes } from "./health-routes.js";
import { createShortcutRoutes } from "./shortcut-routes.js";

export function createApiRoutes(bridgeRegistry: BridgeRegistryService): Router {
  const router = Router();

  router.use(createHealthRoutes());
  router.use(createBridgeRoutes(() => bridgeRegistry.getAll()));
  router.use(createShortcutRoutes());
  router.use(createConfigRoutes());
  router.use(createFileManagerRoutes());
  router.use(createAgentScreenshotRoutes());

  return router;
}
