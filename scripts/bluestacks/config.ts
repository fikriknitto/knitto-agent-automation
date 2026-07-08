import { existsSync } from "node:fs";
import { join } from "node:path";

const DEFAULT_INSTALL_DIR = "C:\\Program Files\\BlueStacks_nxt";
const DEFAULT_DATA_DIR = "C:\\ProgramData\\BlueStacks_nxt";

const DEFAULT_ADB_HOST = "127.0.0.1";
const DEFAULT_ADB_CONNECT_DELAY_MS = 8000;

export type BlueStacksPaths = {
  configPath: string;
  playerPath: string;
};

export type LaunchOptions = {
  paths: BlueStacksPaths;
  delayMs: number;
  dryRun: boolean;
  only: string[] | undefined;
  count: number | undefined;
  adbHost: string;
  adbConnectDelayMs: number;
  skipAdb: boolean;
};

export function resolveBlueStacksPaths(overrides?: Partial<BlueStacksPaths>): BlueStacksPaths {
  const installDir = process.env.BLUESTACKS_INSTALL_DIR?.trim() || DEFAULT_INSTALL_DIR;
  const dataDir = process.env.BLUESTACKS_DATA_DIR?.trim() || DEFAULT_DATA_DIR;

  return {
    configPath:
      overrides?.configPath?.trim() ||
      process.env.BLUESTACKS_CONF_PATH?.trim() ||
      join(dataDir, "bluestacks.conf"),
    playerPath:
      overrides?.playerPath?.trim() ||
      process.env.BLUESTACKS_PLAYER_PATH?.trim() ||
      join(installDir, "HD-Player.exe"),
  };
}

export function assertBlueStacksPaths(paths: BlueStacksPaths): void {
  if (!existsSync(paths.configPath)) {
    throw new Error(`BlueStacks config not found: ${paths.configPath}`);
  }
  if (!existsSync(paths.playerPath)) {
    throw new Error(`BlueStacks player not found: ${paths.playerPath}`);
  }
}

export function parseLaunchOptions(argv: string[]): LaunchOptions {
  const args = argv[0] === "--" ? argv.slice(1) : argv;
  const paths = resolveBlueStacksPaths();
  let delayMs = 0;
  let dryRun = false;
  let only: string[] | undefined;
  let count: number | undefined;
  let configPath = paths.configPath;
  let playerPath = paths.playerPath;
  let adbHost = process.env.BLUESTACKS_ADB_HOST?.trim() || DEFAULT_ADB_HOST;
  let adbConnectDelayMs = envInt("BLUESTACKS_ADB_CONNECT_DELAY_MS", DEFAULT_ADB_CONNECT_DELAY_MS);
  let skipAdb = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--help" || arg === "-h") continue;

    if (arg === "--dry-run") {
      dryRun = true;
      continue;
    }

    if (arg === "--delay-ms") {
      delayMs = parsePositiveInt(args[++i], "--delay-ms");
      continue;
    }

    if (arg === "--only") {
      only = parseList(args[++i], "--only");
      continue;
    }

    if (arg === "--count" || arg === "-n") {
      count = parseCount(args[++i], arg);
      continue;
    }

    if (arg === "--emulator") {
      count = parseCount(args[++i], "--emulator");
      continue;
    }

    const emulatorCount = parseEmulatorCountArg(arg);
    if (emulatorCount !== undefined) {
      count = emulatorCount;
      continue;
    }

    if (arg === "--config") {
      configPath = args[++i]?.trim() ?? "";
      if (!configPath) throw new Error("--config requires a file path");
      continue;
    }

    if (arg === "--player") {
      playerPath = args[++i]?.trim() ?? "";
      if (!playerPath) throw new Error("--player requires an executable path");
      continue;
    }

    if (arg === "--skip-adb") {
      skipAdb = true;
      continue;
    }

    if (arg === "--adb-delay-ms") {
      adbConnectDelayMs = parsePositiveInt(args[++i], "--adb-delay-ms");
      continue;
    }

    if (arg === "--adb-host") {
      adbHost = args[++i]?.trim() ?? "";
      if (!adbHost) throw new Error("--adb-host requires a host");
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  if (count !== undefined && only?.length && count > only.length) {
    console.warn(
      `[warn] --count ${count} exceeds --only list (${only.length}); starting ${only.length} instance(s)`
    );
  }

  return {
    paths: { configPath, playerPath },
    delayMs,
    dryRun,
    only,
    count,
    adbHost,
    adbConnectDelayMs,
    skipAdb,
  };
}

function envInt(key: string, fallback: number): number {
  const raw = process.env[key]?.trim();
  if (!raw) return fallback;
  const value = Number(raw);
  return Number.isInteger(value) && value >= 0 ? value : fallback;
}

function parsePositiveInt(raw: string | undefined, flag: string): number {
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${flag} requires a non-negative integer`);
  }
  return value;
}

function parseCount(raw: string | undefined, flag: string): number {
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`${flag} requires a positive integer`);
  }
  return value;
}

/** Accepts `emulator=3` or `--emulator=3`. */
function parseEmulatorCountArg(arg: string): number | undefined {
  const match = /^(--)?emulator=(\d+)$/.exec(arg);
  if (!match?.[2]) return undefined;
  return parseCount(match[2], "emulator");
}

function parseList(raw: string | undefined, flag: string): string[] {
  const items = raw
    ?.split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (!items?.length) {
    throw new Error(`${flag} requires a comma-separated list of instance names`);
  }
  return items;
}

export const HELP_TEXT = `Start all BlueStacks instances listed in bluestacks.conf

Usage:
  pnpm start:instances [-- emulator=<n>] [options]

Examples:
  pnpm start:instances -- emulator=3
  pnpm start:instances -- --emulator=3
  pnpm start:instances -- --only Pie,Donut --emulator 1

Options:
  emulator=<n>       Start first N instances from config (same as --emulator <n>)
  --emulator <n>     Start at most N instances (from filtered list, in config order)
  -n, --count <n>    Alias for --emulator <n>
  --only <names>     Comma-separated instance names to start (default: all)
  --delay-ms <n>     Wait n ms between launches (default: 0)
  --config <path>    Path to bluestacks.conf
  --player <path>    Path to HD-Player.exe
  --dry-run          Print instances without launching
  --skip-adb         Launch instances only, skip adb connect
  --adb-delay-ms <n> Wait n ms after launch before adb connect (default: ${DEFAULT_ADB_CONNECT_DELAY_MS})
  --adb-host <host>  ADB host (default: ${DEFAULT_ADB_HOST})
  -h, --help         Show this help

Environment:
  BLUESTACKS_DATA_DIR              Default: ${DEFAULT_DATA_DIR}
  BLUESTACKS_INSTALL_DIR           Default: ${DEFAULT_INSTALL_DIR}
  BLUESTACKS_CONF_PATH             Override config file path
  BLUESTACKS_PLAYER_PATH           Override HD-Player.exe path
  BLUESTACKS_ADB_HOST              Default: ${DEFAULT_ADB_HOST}
  BLUESTACKS_ADB_CONNECT_DELAY_MS  Default: ${DEFAULT_ADB_CONNECT_DELAY_MS}
`;
