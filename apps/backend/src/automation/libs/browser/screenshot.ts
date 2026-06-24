import { mkdirSync, writeFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { randomBytes } from "node:crypto";
import config from "../config.js";
import { resolveAgentScreenshotDir } from "../job-context.js";
import { getPage } from "./session.js";

function resolveScreenshotFileName(customPath?: string): string {
  if (!customPath?.trim()) {
    return `shot-${Date.now()}-${randomBytes(3).toString("hex")}.png`;
  }

  const raw = customPath.trim().replace(/[/\\:\0]/g, "_").replace(/\.\./g, "_");
  const base = basename(raw) || "screenshot.png";
  return base.toLowerCase().endsWith(".png") ? base : `${base}.png`;
}

function resolveScreenshotPath(customPath?: string): string {
  const dir = resolveAgentScreenshotDir(config.screenshotDir);
  return join(dir, resolveScreenshotFileName(customPath));
}

export function saveAgentScreenshotBuffer(buffer: Buffer, customPath?: string): string {
  const filePath = resolveScreenshotPath(customPath);
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, buffer);
  return filePath;
}

export async function takePageScreenshot(args: {
  fullPage: boolean;
  path?: string;
}): Promise<{ path: string; base64: string; mimeType: "image/png" }> {
  const page = await getPage();
  const filePath = resolveScreenshotPath(args.path);
  mkdirSync(dirname(filePath), { recursive: true });

  const buffer = (await page.screenshot({
    fullPage: args.fullPage,
    type: "png",
    encoding: "binary",
  })) as Buffer;

  writeFileSync(filePath, buffer);

  return {
    path: filePath,
    base64: buffer.toString("base64"),
    mimeType: "image/png",
  };
}
