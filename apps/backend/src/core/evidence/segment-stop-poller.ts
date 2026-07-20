import { testCaseVideoFilenameForId } from "@knitto/shared";
import { createLogger } from "../logging.js";
import { getAutomationJobId } from "../../platforms/browser/job-context.js";
import {
  isJobRecording,
  stopBrowserSegment,
} from "../../platforms/browser/driver/recording.js";
import { hasActiveSession, getDriver } from "../../platforms/mobile/driver/session.js";
import {
  isMobileJobRecording,
  isMobileSegmentRecording,
  stopMobileSegment,
} from "../../platforms/mobile/session/recording.js";
import {
  clearActiveSegment,
  clearSegmentStopRequest,
  readSegmentStateFile,
} from "./segment-state-file.js";

const logger = createLogger("segment-stop-poller");

const POLL_MS = 250;

async function handleBrowserStopRequest(jobId: string, testCaseId: string): Promise<void> {
  if (!isJobRecording()) return;

  const path = await stopBrowserSegment();
  clearActiveSegment(jobId);
  clearSegmentStopRequest(jobId);
  logger.info(
    `Browser segment stopped via poller: tc=${testCaseId} path=${path ?? "unknown"}`
  );
}

async function handleMobileStopRequest(jobId: string, testCaseId: string): Promise<void> {
  if (!hasActiveSession(jobId)) return;

  const state = readSegmentStateFile(jobId);
  const filename =
    state?.active?.filename ?? testCaseVideoFilenameForId(testCaseId);

  if (!isMobileSegmentRecording(jobId) && !isMobileJobRecording(jobId)) return;

  const driver = await getDriver();
  const path = await stopMobileSegment(driver, jobId, filename);
  clearActiveSegment(jobId);
  clearSegmentStopRequest(jobId);
  logger.info(
    `Mobile segment stopped via poller: tc=${testCaseId} path=${path ?? "unknown"}`
  );
}

async function pollSegmentStop(platform: "browser" | "mobile"): Promise<void> {
  const jobId = getAutomationJobId();
  if (!jobId) return;

  const state = readSegmentStateFile(jobId);
  if (!state?.stopRequested) return;

  const { testCaseId } = state.stopRequested;
  try {
    if (platform === "browser") {
      await handleBrowserStopRequest(jobId, testCaseId);
    } else {
      await handleMobileStopRequest(jobId, testCaseId);
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.warn(`Segment stop poller failed: ${msg}`);
  }
}

export function startSegmentStopPoller(platform: "browser" | "mobile"): void {
  const enabled =
    platform === "browser"
      ? process.env.AUTOMATION_MULTI_TC === "1"
      : process.env.MOBILE_MULTI_TC === "1";
  if (!enabled) return;

  setInterval(() => {
    void pollSegmentStop(platform);
  }, POLL_MS);

  logger.info(`Segment stop poller started (${platform})`);
}
