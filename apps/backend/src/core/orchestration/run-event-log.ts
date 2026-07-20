import { createLogger } from "../logging.js";
import { appendAgentRunLogs } from "../../infra/api-data/agent-runs-client.js";

const logger = createLogger("run-event");

/**
 * Structured Worker log + optional durable log line on API Data (best-effort).
 * Never throws. Do not flood — use for key lifecycle events only.
 */
export async function logAgentRunEvent(opts: {
  agentJobId: string;
  runId?: number;
  apiDataToken?: string;
  level?: "INFO" | "WARNING" | "ERROR";
  message: string;
}): Promise<void> {
  const level = opts.level ?? "INFO";
  const log = logger.child({
    agentJobId: opts.agentJobId,
    runId: opts.runId,
  });

  if (level === "ERROR") log.error(opts.message);
  else if (level === "WARNING") log.warn(opts.message);
  else log.info(opts.message);

  const token = opts.apiDataToken?.trim();
  if (!token || opts.runId == null) return;

  try {
    await appendAgentRunLogs(token, opts.runId, [
      { level, message: opts.message },
    ]);
  } catch {
    // never fail the job for log shipping
  }
}
