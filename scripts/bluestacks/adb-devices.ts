import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export type AdbDevice = {
  udid: string;
  state: string;
};

function parseDevicesOutput(stdout: string): AdbDevice[] {
  const lines = stdout.split(/\r?\n/).slice(1);
  const devices: AdbDevice[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const parts = trimmed.split(/\s+/);
    const udid = parts[0];
    const state = parts[1];
    if (!udid || !state) continue;
    devices.push({ udid, state });
  }

  return devices;
}

export async function adbKillServer(): Promise<void> {
  try {
    await execFileAsync("adb", ["kill-server"], { timeout: 15_000 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    throw new Error(`adb kill-server failed: ${msg}`);
  }
}

export async function listAdbDevices(): Promise<AdbDevice[]> {
  try {
    const { stdout } = await execFileAsync("adb", ["devices", "-l"], { timeout: 15_000 });
    return parseDevicesOutput(stdout);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    throw new Error(`adb devices failed: ${msg}`);
  }
}

export function isAdbTargetOnline(devices: AdbDevice[], target: string): boolean {
  return devices.some((d) => d.udid === target && d.state === "device");
}

export function formatAdbDevicesSummary(devices: AdbDevice[]): string {
  if (!devices.length) return "(no devices)";
  return devices.map((d) => `  ${d.udid}\t${d.state}`).join("\n");
}
