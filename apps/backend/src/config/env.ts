import { z } from "zod";

const envSchema = z.object({
  BACKEND_HOST: z.string().default("0.0.0.0"),
  BACKEND_PORT: z.coerce.number().default(3080),
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
