import "dotenv/config";
import { join } from "node:path";
import {
  resolveMobileMemoryDir,
  resolveMonorepoRoot,
  resolveScreenshotDir,
  resolveStorageRoot,
} from "../../config/paths.js";

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

function envStringList(key: string): string[] | undefined {
  const raw = process.env[key]?.trim();
  if (!raw) return undefined;
  const list = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return list.length ? list : undefined;
}

export default {
  get appiumServerUrl() {
    return process.env.APPIUM_SERVER_URL?.trim() || "http://127.0.0.1:4723";
  },
  get pinnedUdid() {
    return process.env.MOBILE_UDID?.trim() || undefined;
  },
  get deviceUdidsAllowlist() {
    return envStringList("MOBILE_DEVICE_UDIDS");
  },
  get devicePoolEnabled() {
    return envBool("MOBILE_DEVICE_POOL_ENABLED", true);
  },
  get deviceAcquireTimeoutMs() {
    return envInt("MOBILE_DEVICE_ACQUIRE_TIMEOUT_MS", 60_000);
  },
  get implicitWaitMs() {
    return envInt("MOBILE_IMPLICIT_WAIT_MS", 5_000);
  },
  get snapshotMaxElements() {
    return envInt("MOBILE_SNAPSHOT_MAX_ELEMENTS", 200);
  },
  get memoryDir() {
    return resolveMobileMemoryDir();
  },
  get screenshotDir() {
    return resolveScreenshotDir();
  },
  get uploadDir() {
    const fromEnv = process.env.MOBILE_UPLOAD_DIR?.trim();
    if (fromEnv) return join(resolveMonorepoRoot(), fromEnv);
    return join(resolveStorageRoot(), "mobile-uploads");
  },
  get uploadMaxBytes() {
    const fromEnv = process.env.MOBILE_UPLOAD_MAX_BYTES?.trim();
    if (fromEnv) return envInt("MOBILE_UPLOAD_MAX_BYTES", 10 * 1024 * 1024);
    const storageMax = process.env.STORAGE_MAX_UPLOAD_BYTES?.trim();
    if (storageMax) return Number(storageMax) || 10 * 1024 * 1024;
    return 10 * 1024 * 1024;
  },
};
