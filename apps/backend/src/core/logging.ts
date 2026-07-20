export type LogLevel = "debug" | "info" | "warn" | "error" | "log";

export type LogContext = {
  agentJobId?: string;
  runId?: number | string;
};

export interface Logger {
  debug(message: string): void;
  info(message: string): void;
  warn(message: string): void;
  error(message: string | Error): void;
  log(message: string): void;
  child(ctx: LogContext): Logger;
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

function formatContext(ctx?: LogContext): string {
  if (!ctx) return "";
  const parts: string[] = [];
  if (ctx.agentJobId) parts.push(`job=${ctx.agentJobId}`);
  if (ctx.runId != null && ctx.runId !== "") parts.push(`run=${ctx.runId}`);
  return parts.length ? `[${parts.join(" ")}]` : "";
}

function formatMessage(
  level: LogLevel,
  scope: string | undefined,
  message: string,
  ctx?: LogContext
): string {
  const ctxPart = formatContext(ctx);
  const prefix = scope
    ? `[${level.toUpperCase()}][${scope}]${ctxPart}`
    : `[${level.toUpperCase()}]${ctxPart}`;
  return `${prefix} ${message}\n`;
}

function shouldLog(level: LogLevel, minLevel: LogLevel): boolean {
  return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[minLevel];
}

export function createLogger(scope?: string, baseCtx?: LogContext): Logger {
  const minLevel = resolveMinLevel();

  const write = (level: LogLevel, message: string, ctx?: LogContext): void => {
    if (!shouldLog(level, minLevel)) return;
    const merged = { ...baseCtx, ...ctx };
    process.stderr.write(formatMessage(level, scope, message, merged));
  };

  return {
    debug: (message) => write("debug", message),
    info: (message) => write("info", message),
    warn: (message) => write("warn", message),
    error: (message) =>
      write("error", message instanceof Error ? message.message : message),
    log: (message) => write("log", message),
    child: (ctx) => createLogger(scope, { ...baseCtx, ...ctx }),
  };
}

export const logger = createLogger();
