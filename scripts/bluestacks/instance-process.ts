import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

function escapePowerShellLiteral(value: string): string {
  return value.replace(/'/g, "''");
}

export async function findHdPlayerPidsForInstance(instance: string): Promise<number[]> {
  if (process.platform !== "win32") {
    throw new Error("BlueStacks process lookup is only supported on Windows");
  }

  const safeInstance = escapePowerShellLiteral(instance);
  const command = [
    "Get-CimInstance Win32_Process -Filter \"Name='HD-Player.exe'\"",
    `| Where-Object { $_.CommandLine -like '*--instance ${safeInstance}*' }`,
    "| Select-Object -ExpandProperty ProcessId",
  ].join(" ");

  const { stdout } = await execFileAsync(
    "powershell",
    ["-NoProfile", "-Command", command],
    { timeout: 30_000 }
  );

  return stdout
    .split(/\r?\n/)
    .map((line) => Number(line.trim()))
    .filter((pid) => Number.isInteger(pid) && pid > 0);
}

export async function killAllHdPlayerProcesses(): Promise<"killed" | "not-running"> {
  if (process.platform !== "win32") {
    throw new Error("taskkill HD-Player is only supported on Windows");
  }

  try {
    await execFileAsync("taskkill", ["/F", "/IM", "HD-Player.exe"], { timeout: 30_000 });
    return "killed";
  } catch (error) {
    const err = error as NodeJS.ErrnoException & { stderr?: string; stdout?: string };
    const text = `${err.message}\n${err.stderr ?? ""}\n${err.stdout ?? ""}`;
    if (/not found/i.test(text)) {
      return "not-running";
    }
    throw new Error(`taskkill /F /IM HD-Player.exe failed: ${text.trim()}`);
  }
}

export async function isBlueStacksInstanceRunning(instance: string): Promise<boolean> {
  const pids = await findHdPlayerPidsForInstance(instance);
  return pids.length > 0;
}
