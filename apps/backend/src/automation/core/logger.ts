export type LogLevel = "debug" | "info" | "warn" | "error" | "log";

export interface Logger {
  debug(message: string): void;
  info(message: string): void;
  warn(message: string): void;
  error(message: string | Error): void;
  log(message: string): void;
}

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  log: 1,
  warn: 2,
  error: 3,
};

function resolveMinLevel(): LogLevel {
  const raw = process.env.KNITTO_MCP_LOG_LEVEL?.toLowerCase();
  if (raw === "debug" || raw === "info" || raw === "warn" || raw === "error" || raw === "log") {
    return raw;
  }
  return "info";
}

function formatMessage(level: LogLevel, scope: string | undefined, message: string): string {
  const prefix = scope ? `[${level.toUpperCase()}][${scope}]` : `[${level.toUpperCase()}]`;
  return `${prefix} ${message}\n`;
}

function shouldLog(level: LogLevel, minLevel: LogLevel): boolean {
  return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[minLevel];
}

export function createLogger(scope?: string): Logger {
  const minLevel = resolveMinLevel();

  const write = (level: LogLevel, message: string): void => {
    if (!shouldLog(level, minLevel)) return;
    process.stderr.write(formatMessage(level, scope, message));
  };

  return {
    debug: (message) => write("debug", message),
    info: (message) => write("info", message),
    warn: (message) => write("warn", message),
    error: (message) =>
      write("error", message instanceof Error ? message.message : message),
    log: (message) => write("log", message),
  };
}

export const logger = createLogger();
