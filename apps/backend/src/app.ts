import cors from "cors";
import express from "express";
import { errorHandler, notFoundHandler } from "./middlewares/error-handler.js";
import { createApiRoutes } from "./routes/index.js";
import type { AgentRegistryService } from "./agents/agent-registry.service.js";

export function createApp(bridgeRegistry: AgentRegistryService): express.Application {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: "50mb" }));
  app.use("/api", createApiRoutes(bridgeRegistry));
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
