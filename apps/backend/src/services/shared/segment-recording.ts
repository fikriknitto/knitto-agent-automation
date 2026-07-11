import type { MobileConfig, TestCasePlatform } from "@knitto/shared";
import { testCaseVideoFilenameForId } from "@knitto/shared";
import type { Browser } from "webdriverio";
import { createLogger } from "../../automation/core/index.js";
import {
  getOpenPage,
  isRecordablePageUrl,
} from "../../automation/libs/browser/session.js";
import {
  ensureBrowserSegmentRecording,
  stopBrowserSegment,
} from "../../automation/libs/browser/recording.js";
import config from "../../automation/libs/config.js";
import mobileConfig from "../../mobile-automation/libs/config.js";
import {
  getDriver,
  hasActiveSession,
} from "../../mobile-automation/libs/driver/session.js";
import { getMobileJobConfig } from "../../mobile-automation/libs/mobile-job-context.js";
import {
  ensureMobileSegmentRecording,
  setSegmentRecordingManaged,
  stopMobileSegment,
} from "../../mobile-automation/libs/recording.js";
import { setAutomationJobId } from "../../automation/libs/job-context.js";
import {
  clearJobSegmentManaged as clearSegmentContext,
  clearPendingSegment,
  clearSegmentStarted,
  getPendingSegment,
  isJobSegmentManaged,
  isSegmentStarted,
  markJobSegmentManaged as markSegmentContext,
  markSegmentStarted,
  setActiveTestCaseId,
  setPendingSegment,
} from "./segment-context.js";

const logger = createLogger("segment-recording");

const APP_VISIBLE_POLL_MS = 200;
const APP_VISIBLE_TIMEOUT_MS = 5000;

export type StopSegmentResult = {
  path?: string;
  warning?: string;
};

export { isJobSegmentManaged };

export function markJobSegmentManaged(jobId: string): void {
  markSegmentContext(jobId);
  setSegmentRecordingManaged(jobId, true);
}

export function clearJobSegmentManaged(jobId: string): void {
  clearSegmentContext(jobId);
  setSegmentRecordingManaged(jobId, false);
}

function isRecordingEnabled(): boolean {
  return config.recordVideo || mobileConfig.recordVideo;
}

async function waitForAppVisible(
  driver: Browser,
  appPackage: string,
  timeoutMs = APP_VISIBLE_TIMEOUT_MS
): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const currentPackage = await driver.getCurrentPackage();
      if (currentPackage === appPackage) return true;
    } catch {
      // app may not be foreground yet
    }
    await new Promise((resolve) => setTimeout(resolve, APP_VISIBLE_POLL_MS));
  }
  return false;
}

async function tryStartBrowserSegment(jobId: string, testCaseId: string): Promise<boolean> {
  const openPage = getOpenPage();
  if (!openPage) {
    logger.info(`Browser segment deferred for ${testCaseId} — no open page yet`);
    return false;
  }

  if (!isRecordablePageUrl(openPage.url())) {
    logger.info(
      `Browser segment deferred for ${testCaseId} — page not navigated (${openPage.url()})`
    );
    return false;
  }

  try {
    const started = await ensureBrowserSegmentRecording(openPage, jobId);
    if (started) {
      markSegmentStarted(jobId, testCaseId);
      logger.info(`Browser segment started after navigate: tc=${testCaseId}`);
      return true;
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.warn(`Browser segment not ready for ${testCaseId}: ${msg}`);
  }
  return false;
}

async function tryStartMobileSegment(jobId: string, testCaseId: string): Promise<boolean> {
  if (!hasActiveSession(jobId)) {
    logger.info(`Mobile segment deferred for ${testCaseId} — no active session`);
    return false;
  }

  const mobileCfg = getMobileJobConfig(jobId);
  if (!mobileCfg?.appPackage) {
    logger.info(`Mobile segment deferred for ${testCaseId} — app package not configured`);
    return false;
  }

  try {
    const driver = await getDriver();
    const visible = await waitForAppVisible(driver, mobileCfg.appPackage);
    if (!visible) {
      logger.warn(
        `Mobile app ${mobileCfg.appPackage} not foreground before segment start — recording anyway`
      );
    }

    const started = await ensureMobileSegmentRecording(driver, jobId);
    if (started) {
      markSegmentStarted(jobId, testCaseId);
      logger.info(`Mobile segment started after launch: tc=${testCaseId}`);
      return true;
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.warn(`Mobile segment not ready for ${testCaseId}: ${msg}`);
  }
  return false;
}

export async function ensureSegmentRecordingStarted(jobId: string): Promise<boolean> {
  const pending = getPendingSegment(jobId);
  if (!pending || isSegmentStarted(jobId, pending.testCaseId)) {
    return isSegmentStarted(jobId, pending?.testCaseId ?? "");
  }

  setAutomationJobId(jobId);
  const { testCaseId, platform } = pending;

  if (platform === "browser") {
    return tryStartBrowserSegment(jobId, testCaseId);
  }

  return tryStartMobileSegment(jobId, testCaseId);
}

export async function startSegmentRecording(
  jobId: string,
  testCaseId: string,
  platform: TestCasePlatform,
  _mobileConfig?: MobileConfig
): Promise<void> {
  if (!isRecordingEnabled()) return;

  setAutomationJobId(jobId);
  setActiveTestCaseId(testCaseId);
  const filename = testCaseVideoFilenameForId(testCaseId);

  setPendingSegment(jobId, { testCaseId, filename, platform });
  logger.info(`Segment deferred: job=${jobId} tc=${testCaseId} platform=${platform}`);
}

export async function stopSegmentRecording(
  jobId: string,
  testCaseId: string,
  platform: TestCasePlatform
): Promise<StopSegmentResult> {
  if (!isRecordingEnabled()) return {};

  setAutomationJobId(jobId);

  let warning: string | undefined;
  if (!isSegmentStarted(jobId, testCaseId)) {
    warning = `Segment recording for ${testCaseId} never started — video may be missing or black`;
    logger.warn(warning);
  }

  let path: string | undefined;

  if (platform === "browser") {
    path = await stopBrowserSegment();
  } else if (hasActiveSession(jobId)) {
    const driver = await getDriver();
    const filename = testCaseVideoFilenameForId(testCaseId);
    path = await stopMobileSegment(driver, jobId, filename);
  }

  clearPendingSegment(jobId);
  clearSegmentStarted(jobId, testCaseId);
  setActiveTestCaseId(null);

  return { path, warning };
}
