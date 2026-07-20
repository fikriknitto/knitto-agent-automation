import { createLogger } from "../logging.js";
import {
  closeMobileSessionFromState,
  terminateMobileAppFromState,
} from "../../mobile-automation/libs/mobile-session-cleanup.js";

const logger = createLogger("mcp-mobile-cleanup");

export async function closeMobileSessionFromStateFile(jobId: string): Promise<boolean> {
  await terminateMobileAppFromState(jobId).catch(() => false);

  const closed = await closeMobileSessionFromState(jobId);
  if (closed) {
    logger.info(`Mobile session closed via state file: job=${jobId}`);
  } else {
    logger.warn(`No mobile session state file for job=${jobId}`);
  }
  return closed;
}
