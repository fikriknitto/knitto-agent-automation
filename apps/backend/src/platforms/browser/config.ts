import "dotenv/config";
import { join } from "node:path";
import { resolveMemoryDir, resolveMonorepoRoot, resolveScreenshotDir } from "../../config/paths.js";

function envBool(key: string, fallback: boolean): boolean {
  const raw = process.env[key]?.trim().toLowerCase();
  if (!raw) return fallback;
  return raw === "1" || raw === "true" || raw === "yes";
}

function envInt(key: string, fallback: number): number {
  const raw = process.env[key]?.trim();
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

export default {
  get headless() {
    return envBool("AUTOMATION_HEADLESS", false);
  },
  get slowMoMs() {
    return envInt("AUTOMATION_SLOW_MO_MS", 0);
  },
  get browserTimeoutMs() {
    return envInt("AUTOMATION_BROWSER_TIMEOUT_MS", 30_000);
  },
  get memoryDir() {
    return resolveMemoryDir();
  },
  get screenshotDir() {
    return resolveScreenshotDir();
  },
  get uploadDir() {
    const fromEnv = process.env.AUTOMATION_UPLOAD_DIR?.trim();
    if (fromEnv) return join(resolveMonorepoRoot(), fromEnv);
    return join(this.screenshotDir, "uploads");
  },
  get uploadMaxBytes() {
    return envInt("AUTOMATION_UPLOAD_MAX_BYTES", 10 * 1024 * 1024);
  },
  get viewportWidth() {
    return envInt("AUTOMATION_VIEWPORT_WIDTH", 1280);
  },
  get viewportHeight() {
    return envInt("AUTOMATION_VIEWPORT_HEIGHT", 720);
  },
  get recordVideo() {
    return envBool("AUTOMATION_RECORD_VIDEO", true);
  },
  get recordFps() {
    return envInt("AUTOMATION_RECORD_FPS", 20);
  },
  get ffmpegPath() {
    return process.env.AUTOMATION_FFMPEG_PATH?.trim() || undefined;
  },
  get videoFilename() {
    const name = process.env.AUTOMATION_VIDEO_FILENAME?.trim();
    return name || "recording.mp4";
  },
};
