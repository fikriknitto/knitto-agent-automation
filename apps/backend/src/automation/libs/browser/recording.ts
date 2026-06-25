import { existsSync } from "node:fs";
import { mkdir, stat } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { Page } from "puppeteer";
import { PuppeteerScreenRecorder } from "puppeteer-screen-recorder";
import { createLogger } from "../../core/index.js";
import {
  getAutomationJobId,
  resolveAgentScreenshotDir,
  resolveAgentScreenshotDirForJob,
} from "../job-context.js";
import config from "../config.js";

const logger = createLogger("browser-recording");

let activeRecorder: PuppeteerScreenRecorder | null = null;
let activeOutputPath: string | null = null;
let stopPromise: Promise<string | undefined> | null = null;

export function resolveAgentVideoPath(jobId?: string): string {
  const filename = config.videoFilename;
  const dir = jobId
    ? resolveAgentScreenshotDirForJob(jobId)
    : resolveAgentScreenshotDir();
  return join(dir, filename);
}

export function isJobRecording(): boolean {
  return activeRecorder !== null;
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
      // file belum dibuat ffmpeg
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  return existsSync(filePath);
}

/** Poll until ffmpeg finishes writing recording.mp4 (stable non-zero size). */
export async function waitForJobVideoReady(
  jobId: string,
  timeoutMs = 8000
): Promise<void> {
  if (!config.recordVideo) return;
  const path = resolveAgentVideoPath(jobId);
  await waitForVideoFile(path, timeoutMs);
}

export async function startJobRecording(page: Page): Promise<void> {
  if (!config.recordVideo || activeRecorder) return;

  const jobId = getAutomationJobId();
  if (!jobId) return;

  const savePath = resolveAgentVideoPath(jobId);

  try {
    await mkdir(dirname(savePath), { recursive: true });

    const recorder = new PuppeteerScreenRecorder(page, {
      followNewTab: true,
      fps: config.recordFps,
      ffmpeg_Path: config.ffmpegPath ?? null,
      videoFrame: {
        width: config.viewportWidth,
        height: config.viewportHeight,
      },
      videoCodec: "libx264",
      videoPreset: "ultrafast",
    });

    await recorder.start(savePath);
    activeRecorder = recorder;
    activeOutputPath = savePath;

    const finalizeOnBrowserEnd = () => {
      void stopJobRecording();
    };
    page.once("close", finalizeOnBrowserEnd);
    page.browser().once("disconnected", finalizeOnBrowserEnd);

    logger.info(`Recording started: ${savePath}`);
  } catch (error) {
    logger.warn(
      `Recording failed to start: ${error instanceof Error ? error.message : String(error)}`
    );
    activeRecorder = null;
    activeOutputPath = null;
  }
}

async function finalizeStop(): Promise<string | undefined> {
  if (!activeRecorder) {
    return activeOutputPath && existsSync(activeOutputPath) ? activeOutputPath : undefined;
  }

  const outputPath = activeOutputPath;
  const recorder = activeRecorder;
  activeRecorder = null;
  activeOutputPath = null;

  try {
    await recorder.stop();
    if (outputPath) {
      const ready = await waitForVideoFile(outputPath);
      if (ready) {
        logger.info(`Recording saved: ${outputPath}`);
        return outputPath;
      }
    }
  } catch (error) {
    logger.warn(
      `Recording stop failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  return outputPath && existsSync(outputPath) ? outputPath : undefined;
}

export async function stopJobRecording(): Promise<string | undefined> {
  if (stopPromise) return stopPromise;

  stopPromise = finalizeStop().finally(() => {
    stopPromise = null;
  });

  return stopPromise;
}
