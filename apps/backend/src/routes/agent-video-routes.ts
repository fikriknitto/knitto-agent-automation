import { Router } from "express";
import { AgentVideoController } from "../controllers/agent-video-controller.js";

export function createAgentVideoRoutes(): Router {
  const router = Router();
  const controller = new AgentVideoController();

  router.get("/agent-videos/:jobId/:filename", (req, res) => controller.serve(req, res));

  return router;
}
