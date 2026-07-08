import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { runSerial } from "./adb-queue.js";

const execFileAsync = promisify(execFile);

export type AdbDevice = {
  udid: string;
  state: string;
  model?: string;
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

    const modelMatch = trimmed.match(/model:(\S+)/);
    devices.push({
      udid,
      state,
      model: modelMatch?.[1]?.replace(/_/g, " "),
    });
  }

  return devices;
}

async function runAdb(args: string[], udid?: string): Promise<string> {
  return runSerial(async () => {
    const fullArgs = udid ? ["-s", udid, ...args] : args;
    const { stdout } = await execFileAsync("adb", fullArgs, {
      timeout: 30_000,
      maxBuffer: 10 * 1024 * 1024,
    });
    return stdout;
  });
}

export async function listDevices(): Promise<AdbDevice[]> {
  try {
    const stdout = await runAdb(["devices", "-l"]);
    return parseDevicesOutput(stdout);
  } catch {
    return [];
  }
}

export async function isDeviceOnline(udid: string): Promise<boolean> {
  const devices = await listDevices();
  return devices.some((d) => d.udid === udid && d.state === "device");
}

export async function listPackages(udid: string, query?: string): Promise<string[]> {
  const stdout = await runAdb(["shell", "pm", "list", "packages", "-3"], udid);
  const q = query?.trim().toLowerCase();
  const packages = stdout
    .split(/\r?\n/)
    .map((line) => line.replace(/^package:/, "").trim())
    .filter(Boolean);

  if (!q) return packages.sort();
  return packages.filter((pkg) => pkg.toLowerCase().includes(q)).sort();
}

export async function resolveMainActivity(udid: string, pkg: string): Promise<string> {
  const stdout = await runAdb(
    ["shell", "cmd", "package", "resolve-activity", "--brief", pkg],
    udid
  );
  const lines = stdout
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const activityLine = lines.find((l) => l.includes("/"));
  if (!activityLine) {
    throw new Error(`Could not resolve main activity for package: ${pkg}`);
  }

  const slash = activityLine.indexOf("/");
  return activityLine.slice(slash + 1);
}

export async function pushFile(
  udid: string,
  localPath: string,
  remotePath: string
): Promise<void> {
  await runAdb(["push", localPath, remotePath], udid);
}
