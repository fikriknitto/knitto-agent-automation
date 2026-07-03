import { existsSync } from "node:fs";
import { join } from "node:path";

const DEFAULT_INSTALL_DIR = "C:\\Program Files\\BlueStacks_nxt";
const DEFAULT_DATA_DIR = "C:\\ProgramData\\BlueStacks_nxt";

export type BlueStacksPaths = {
  configPath: string;
  playerPath: string;
};

export type LaunchOptions = {
  paths: BlueStacksPaths;
  delayMs: number;
  dryRun: boolean;
  only: string[] | undefined;
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
  let configPath = paths.configPath;
  let playerPath = paths.playerPath;

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

    throw new Error(`Unknown argument: ${arg}`);
  }

  return {
    paths: { configPath, playerPath },
    delayMs,
    dryRun,
    only,
  };
}

function parsePositiveInt(raw: string | undefined, flag: string): number {
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${flag} requires a non-negative integer`);
  }
  return value;
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
  pnpm start:instances [options]

Options:
  --only <names>     Comma-separated instance names to start (default: all)
  --delay-ms <n>     Wait n ms between launches (default: 0)
  --config <path>    Path to bluestacks.conf
  --player <path>    Path to HD-Player.exe
  --dry-run          Print instances without launching
  -h, --help         Show this help

Environment:
  BLUESTACKS_DATA_DIR      Default: ${DEFAULT_DATA_DIR}
  BLUESTACKS_INSTALL_DIR   Default: ${DEFAULT_INSTALL_DIR}
  BLUESTACKS_CONF_PATH     Override config file path
  BLUESTACKS_PLAYER_PATH   Override HD-Player.exe path
`;
