import { Router } from "express";
import { AgentScreenshotController } from "./agent-screenshot-controller.js";

export function createAgentScreenshotRoutes(): Router {
  const router = Router();
  const controller = new AgentScreenshotController();

  router.get("/agent-screenshots/:jobId/:filename", (req, res) =>
    controller.serve(req, res)
  );

  return router;
}
