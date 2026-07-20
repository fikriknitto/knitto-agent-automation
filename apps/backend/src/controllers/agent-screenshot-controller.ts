import type { Request, Response } from "express";
import { createReadStream } from "node:fs";
import { resolveAgentScreenshotFile } from "../services/agent-screenshots.js";
import { sanitizeJobId } from "../core/job-context.js";

export class AgentScreenshotController {
  serve(req: Request, res: Response): void {
    const jobId = typeof req.params.jobId === "string" ? req.params.jobId : "";
    const filename = typeof req.params.filename === "string" ? req.params.filename : "";

    if (!jobId || !filename) {
      res.status(400).json({ error: "jobId and filename are required" });
      return;
    }

    const filePath = resolveAgentScreenshotFile(sanitizeJobId(jobId), filename);
    if (!filePath) {
      res.status(404).json({ error: "Screenshot not found" });
      return;
    }

    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "private, max-age=3600");
    createReadStream(filePath).pipe(res);
  }
}
