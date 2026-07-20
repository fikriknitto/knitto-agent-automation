import { Router } from "express";
import type { AgentRegistryService } from "../agents/agent-registry.service.js";
import { createAgentScreenshotRoutes } from "./agent-screenshot-routes.js";
import { createAgentVideoRoutes } from "./agent-video-routes.js";
import { createAppMemoryRoutes } from "./app-memory-routes.js";
import { createBridgeRoutes } from "./bridge-routes.js";
import { createConfigRoutes } from "./config-routes.js";
import { createFileManagerRoutes } from "./file-manager-routes.js";
import { createHealthRoutes } from "./health-routes.js";
import { createPromptShortcutRoutes } from "./prompt-shortcut-routes.js";
import { createMobileDeviceRoutes } from "./mobile-device-routes.js";
import { createMobileAppMemoryRoutes } from "./mobile-app-memory-routes.js";

export function createApiRoutes(bridgeRegistry: AgentRegistryService): Router {
  const router = Router();

  router.use(createHealthRoutes());
  router.use(createBridgeRoutes(() => bridgeRegistry.getAll()));
  router.use(createPromptShortcutRoutes(bridgeRegistry));
  router.use(createAppMemoryRoutes());
  router.use(createMobileAppMemoryRoutes());
  router.use(createMobileDeviceRoutes());
  router.use(createConfigRoutes());
  router.use(createFileManagerRoutes());
  router.use(createAgentScreenshotRoutes());
  router.use(createAgentVideoRoutes());

  return router;
}
