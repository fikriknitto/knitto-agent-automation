import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export function formatAdbTarget(host: string, port: number): string {
  return `${host}:${port}`;
}

export async function adbConnect(host: string, port: number): Promise<string> {
  const target = formatAdbTarget(host, port);
  try {
    const { stdout } = await execFileAsync("adb", ["connect", target], {
      timeout: 15_000,
    });
    return stdout.trim();
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    throw new Error(`adb connect ${target} failed: ${msg}`);
  }
}
