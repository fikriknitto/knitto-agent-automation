import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export type LaunchState = {
  instances: string[];
  adbHost: string;
  launchedAt: string;
};

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const stateDir = join(repoRoot, ".bluestacks");
const stateFile = join(stateDir, "last-launched.json");

export function writeLaunchState(instances: string[], adbHost: string): void {
  const payload: LaunchState = {
    instances,
    adbHost,
    launchedAt: new Date().toISOString(),
  };
  mkdirSync(stateDir, { recursive: true });
  writeFileSync(stateFile, JSON.stringify(payload, null, 2), "utf8");
}

export function readLaunchState(): LaunchState {
  try {
    const raw = readFileSync(stateFile, "utf8");
    const parsed = JSON.parse(raw) as LaunchState;
    if (!Array.isArray(parsed.instances) || !parsed.instances.length) {
      throw new Error("invalid instances");
    }
    return parsed;
  } catch {
    throw new Error(
      "Launch state not found. Jalankan `pnpm start:instances` dulu, atau gunakan `--all`."
    );
  }
}

export function clearLaunchState(): void {
  try {
    writeFileSync(stateFile, "", "utf8");
  } catch {
    // ignore — state file may not exist
  }
}
