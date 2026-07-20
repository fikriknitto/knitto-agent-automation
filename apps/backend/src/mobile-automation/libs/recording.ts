import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { stat } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { Browser } from "webdriverio";
import { createLogger } from "../../automation/core/index.js";
import { getAutomationJobId, resolveAgentScreenshotDirForJob } from "./job-context.js";
import mobileConfig from "./config.js";
import {
  getPendingSegment,
  isJobSegmentManaged,
  isSegmentStarted,
  markSegmentStarted,
} from "../../core/evidence/segment-context.js";
import { setActiveSegment, clearActiveSegment } from "../../core/evidence/segment-state-file.js";

const logger = createLogger("mobile-recording");

const recordingJobs = new Set<string>();
const segmentRecordingJobs = new Set<string>();

export function isSegmentRecordingManaged(jobId: string): boolean {
  return segmentRecordingJobs.has(jobId) || isJobSegmentManaged(jobId);
}

export function isMobileSegmentRecording(jobId: string): boolean {
  return recordingJobs.has(jobId) && segmentRecordingJobs.has(jobId);
}

export function isMobileJobRecording(jobId: string): boolean {
  return recordingJobs.has(jobId) && !segmentRecordingJobs.has(jobId);
}

export function setSegmentRecordingManaged(jobId: string, managed: boolean): void {
  if (managed) segmentRecordingJobs.add(jobId);
  else segmentRecordingJobs.delete(jobId);
}

export function resolveMobileVideoPath(jobId?: string, filename?: string): string {
  const id = jobId ?? getAutomationJobId();
  if (!id) throw new Error("Job ID required for video path");
  const name = filename ?? mobileConfig.videoFilename;
  return join(resolveAgentScreenshotDirForJob(id), name);
}

export async function waitForMobileJobVideoReady(
  jobId: string,
  timeoutMs = 8000
): Promise<void> {
  if (!mobileConfig.recordVideo) return;
  await waitForVideoFile(resolveMobileVideoPath(jobId), timeoutMs);
}

async function waitForVideoFile(
  filePath: string,
  timeoutMs = 8000,
  intervalMs = 150
): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  let lastSize = -1;

  while (Date.now() < deadline) {
    try {
      const stats = await stat(filePath);
      if (stats.size > 0) {
        if (stats.size === lastSize) return true;
        lastSize = stats.size;
      }
    } catch {
      // file belum ditulis
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  return existsSync(filePath);
}

const MIN_VIDEO_BYTES = 10_240;

export async function ensureMobileSegmentRecording(
  driver: Browser,
  jobId: string
): Promise<boolean> {
  const pending = getPendingSegment(jobId);
  if (!pending || pending.platform !== "mobile") return false;

  if (isSegmentStarted(jobId, pending.testCaseId)) {
    return true;
  }

  if (isMobileSegmentRecording(jobId)) {
    markSegmentStarted(jobId, pending.testCaseId);
    return true;
  }

  if (isMobileJobRecording(jobId)) {
    await stopMobileJobRecording(driver);
  }

  await startMobileSegment(driver, jobId, pending.filename);
  if (recordingJobs.has(jobId) && segmentRecordingJobs.has(jobId)) {
    markSegmentStarted(jobId, pending.testCaseId);
    return true;
  }
  return false;
}

export async function startMobileJobRecording(driver: Browser): Promise<void> {
  if (!mobileConfig.recordVideo) return;

  const jobId = getAutomationJobId();
  if (!jobId || recordingJobs.has(jobId)) return;
  if (isSegmentRecordingManaged(jobId)) return;

  try {
    await driver.startRecordingScreen({
      videoType: "mp4",
      videoQuality: "medium",
      videoFps: mobileConfig.recordFps,
      timeLimit: mobileConfig.recordTimeLimitSec,
      bitRate: mobileConfig.recordBitRate,
    });
    recordingJobs.add(jobId);
    logger.info(`startRecordingScreen started: job=${jobId}`);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.warn(`startRecordingScreen failed: ${msg}`);
  }
}

export async function stopMobileJobRecording(driver: Browser): Promise<string | undefined> {
  const jobId = getAutomationJobId();
  if (!jobId || !recordingJobs.has(jobId)) return undefined;
  if (segmentRecordingJobs.has(jobId)) return undefined;

  recordingJobs.delete(jobId);

  try {
    const payload = await driver.stopRecordingScreen();
    const base64 = typeof payload === "string" ? payload : "";
    if (!base64) return undefined;

    const outPath = resolveMobileVideoPath(jobId);
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, Buffer.from(base64, "base64"));
    await waitForVideoFile(outPath);
    try {
      const fileStats = await stat(outPath);
      logger.info(`stopRecordingScreen saved: ${outPath} (${fileStats.size} bytes)`);
      if (fileStats.size < MIN_VIDEO_BYTES) {
        logger.warn(
          `Mobile recording file suspiciously small (${fileStats.size} bytes) — video may be empty or black: ${outPath}`
        );
      }
    } catch {
      logger.info(`stopRecordingScreen saved: ${outPath}`);
    }
    return outPath;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.warn(`stopRecordingScreen failed: ${msg}`);
    return undefined;
  }
}

export async function startMobileSegment(
  driver: Browser,
  jobId: string,
  filename: string
): Promise<void> {
  if (!mobileConfig.recordVideo) return;
  if (recordingJobs.has(jobId)) {
    await stopMobileSegment(driver, jobId, mobileConfig.videoFilename);
  }

  segmentRecordingJobs.add(jobId);
  recordingJobs.add(jobId);

  try {
    await driver.startRecordingScreen({
      videoType: "mp4",
      videoQuality: "medium",
      videoFps: mobileConfig.recordFps,
      timeLimit: mobileConfig.recordTimeLimitSec,
      bitRate: mobileConfig.recordBitRate,
    });
    const pending = getPendingSegment(jobId);
    if (pending) {
      setActiveSegment(jobId, {
        testCaseId: pending.testCaseId,
        filename,
        outputPath: resolveMobileVideoPath(jobId, filename),
        platform: "mobile",
        startedAt: new Date().toISOString(),
      });
    }
    logger.info(`Mobile segment recording started: job=${jobId} file=${filename}`);
  } catch (error) {
    recordingJobs.delete(jobId);
    segmentRecordingJobs.delete(jobId);
    const msg = error instanceof Error ? error.message : String(error);
    logger.warn(`startMobileSegment failed: ${msg}`);
  }
}

export async function stopMobileSegment(
  driver: Browser,
  jobId: string,
  filename: string
): Promise<string | undefined> {
  if (!recordingJobs.has(jobId)) return undefined;

  const wasSegment = segmentRecordingJobs.has(jobId);
  recordingJobs.delete(jobId);
  segmentRecordingJobs.delete(jobId);

  try {
    const payload = await driver.stopRecordingScreen();
    const base64 = typeof payload === "string" ? payload : "";
    if (!base64) return undefined;

    const outPath = resolveMobileVideoPath(jobId, filename);
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, Buffer.from(base64, "base64"));
    await waitForVideoFile(outPath);
    try {
      const fileStats = await stat(outPath);
      logger.info(`Mobile segment saved: ${outPath} (${fileStats.size} bytes)`);
      if (fileStats.size < MIN_VIDEO_BYTES) {
        logger.warn(
          `Mobile segment file suspiciously small (${fileStats.size} bytes) — video may be empty or black: ${outPath}`
        );
      }
    } catch {
      logger.info(`Mobile segment saved: ${outPath}`);
    }
    if (wasSegment) clearActiveSegment(jobId);
    return outPath;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.warn(`stopMobileSegment failed: ${msg}`);
    return undefined;
  }
}
