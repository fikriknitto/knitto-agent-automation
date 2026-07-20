import { mkdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const MOBILE_STATE_DIR = join(tmpdir(), "knitto-automation-mobile");

export type MobileSessionState = {
  jobId: string;
  sessionId: string;
  udid: string;
  appPackage: string;
};

function stateFilePath(jobId: string): string {
  const safe = jobId.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 128);
  return join(MOBILE_STATE_DIR, `${safe}.json`);
}

export function writeMobileSessionState(jobId: string, state: MobileSessionState): void {
  try {
    mkdirSync(MOBILE_STATE_DIR, { recursive: true });
    writeFileSync(stateFilePath(jobId), JSON.stringify(state));
  } catch {
    // best-effort — cleanup falls back to device pool release
  }
}

export function readMobileSessionState(jobId: string): MobileSessionState | undefined {
  try {
    const raw = readFileSync(stateFilePath(jobId), "utf8");
    return JSON.parse(raw) as MobileSessionState;
  } catch {
    return undefined;
  }
}

export function clearMobileSessionState(jobId: string): void {
  try {
    unlinkSync(stateFilePath(jobId));
  } catch {
    // ignore
  }
}
