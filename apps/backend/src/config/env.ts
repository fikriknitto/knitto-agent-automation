import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  BACKEND_HOST: z.string().default("0.0.0.0"),
  BACKEND_PORT: z.coerce.number().default(3080),
  AUTOMATION_WS_HOST: z.string().optional(),
  AUTOMATION_WS_PORT: z.coerce.number().optional(),
  AUTOMATION_HEADLESS: z
    .string()
    .optional()
    .transform((v) => v === "1" || v === "true"),
  GEMINI_API_KEY: z.string().optional(),
  CURSOR_API_KEY: z.string().optional(),
  NINEROUTER_BASE_URL: z.string().optional(),
  NINEROUTER_API_KEY: z.string().optional(),
  KNITTO_BRIDGE_MODEL: z.string().default("gemini-2.5-flash"),
  KNITTO_BRIDGE_CWD: z.string().optional(),
  KNITTO_BRIDGE_MAX_CONCURRENT: z.coerce.number().default(1),
  KNITTO_BRIDGE_JOB_TIMEOUT_MS: z.coerce.number().default(600_000),
  KNITTO_BRIDGE_MAX_TOOL_CALLS: z.coerce.number().default(40),
  NINEROUTER_MODEL: z.string().optional(),
  NINEROUTER_MAX_RETRIES: z.coerce.number().default(5),
  NINEROUTER_RETRY_DELAY_MS: z.coerce.number().default(2000),
  KNITTO_MCP_LOG_LEVEL: z
    .enum(["debug", "info", "warn", "error", "log"])
    .default("info"),
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(): Env {
  return envSchema.parse(process.env);
}

export function resolveHttpHost(env: Env): string {
  return env.BACKEND_HOST;
}

export function resolveHttpPort(env: Env): number {
  return env.BACKEND_PORT;
}
