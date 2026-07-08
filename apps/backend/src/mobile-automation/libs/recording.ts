import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { stat } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { Browser } from "webdriverio";
import { createLogger } from "../../automation/core/index.js";
import { getAutomationJobId, resolveAgentScreenshotDirForJob } from "./job-context.js";
import mobileConfig from "./config.js";

const logger = createLogger("mobile-recording");

const recordingJobs = new Set<string>();

export function resolveMobileVideoPath(jobId?: string): string {
  const id = jobId ?? getAutomationJobId();
  if (!id) throw new Error("Job ID required for video path");
  return join(resolveAgentScreenshotDirForJob(id), mobileConfig.videoFilename);
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

export async function startMobileJobRecording(driver: Browser): Promise<void> {
  if (!mobileConfig.recordVideo) return;

  const jobId = getAutomationJobId();
  if (!jobId || recordingJobs.has(jobId)) return;

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

  recordingJobs.delete(jobId);

  try {
    const payload = await driver.stopRecordingScreen();
    const base64 = typeof payload === "string" ? payload : "";
    if (!base64) return undefined;

    const outPath = resolveMobileVideoPath(jobId);
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, Buffer.from(base64, "base64"));
    await waitForVideoFile(outPath);
    logger.info(`stopRecordingScreen saved: ${outPath}`);
    return outPath;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.warn(`stopRecordingScreen failed: ${msg}`);
    return undefined;
  }
}
