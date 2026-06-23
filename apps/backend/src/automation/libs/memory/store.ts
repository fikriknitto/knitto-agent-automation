import { mkdirSync, readFileSync, writeFileSync, existsSync, appendFileSync } from "node:fs";
import { join } from "node:path";
import { ToolError } from "../../core/index.js";
import config from "../config.js";

function sanitizeAppId(appId: string): string {
  const safe = appId.trim().replace(/[^a-zA-Z0-9_-]/g, "-");
  if (!safe) throw new ToolError("appId is invalid after sanitization");
  return safe;
}

function memoryPath(appId: string): string {
  mkdirSync(config.memoryDir, { recursive: true });
  return join(config.memoryDir, `${sanitizeAppId(appId)}.md`);
}

export function readAppMemory(appId: string): {
  appId: string;
  content: string;
  exists: boolean;
  path: string;
} {
  const path = memoryPath(appId);
  const exists = existsSync(path);
  const content = exists ? readFileSync(path, "utf8") : "";
  return { appId: sanitizeAppId(appId), content, exists, path };
}

export function writeAppMemory(
  appId: string,
  content: string,
  mode: "append" | "replace"
): { appId: string; path: string; mode: "append" | "replace"; bytesWritten: number } {
  const path = memoryPath(appId);
  const safeId = sanitizeAppId(appId);
  const body = content.endsWith("\n") ? content : `${content}\n`;

  if (mode === "replace" || !existsSync(path)) {
    writeFileSync(path, body, "utf8");
    return { appId: safeId, path, mode, bytesWritten: Buffer.byteLength(body, "utf8") };
  }

  const prefix = readFileSync(path, "utf8").endsWith("\n") ? "" : "\n";
  appendFileSync(path, `${prefix}${body}`, "utf8");
  return {
    appId: safeId,
    path,
    mode,
    bytesWritten: Buffer.byteLength(`${prefix}${body}`, "utf8"),
  };
}
