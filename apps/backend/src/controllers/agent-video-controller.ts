import type { Request, Response } from "express";
import { createReadStream } from "node:fs";
import { sanitizeJobId } from "../platforms/browser/job-context.js";
import { resolveAgentVideoFile } from "../services/agent-videos.js";

export class AgentVideoController {
  serve(req: Request, res: Response): void {
    const jobId = typeof req.params.jobId === "string" ? req.params.jobId : "";
    const filename = typeof req.params.filename === "string" ? req.params.filename : "";

    if (!jobId || !filename) {
      res.status(400).json({ error: "jobId and filename are required" });
      return;
    }

    const filePath = resolveAgentVideoFile(sanitizeJobId(jobId), filename);
    if (!filePath) {
      res.status(404).json({ error: "Video not found" });
      return;
    }

    res.setHeader("Content-Type", "video/mp4");
    createReadStream(filePath).pipe(res);
  }
}
