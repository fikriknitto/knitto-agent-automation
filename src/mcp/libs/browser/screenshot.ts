import { mkdirSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import { randomBytes } from "node:crypto";
import config from "../config.js";
import { getPage } from "./session.js";

function resolveScreenshotPath(customPath?: string): string {
  if (!customPath?.trim()) {
    return join(config.screenshotDir, `shot-${Date.now()}-${randomBytes(3).toString("hex")}.png`);
  }

  const raw = customPath.trim().replace(/[/\\:\0]/g, "_").replace(/\.\./g, "_");
  const base = basename(raw) || "screenshot.png";
  const fileName = base.toLowerCase().endsWith(".png") ? base : `${base}.png`;
  return join(config.screenshotDir, fileName);
}

export async function takePageScreenshot(args: {
  fullPage: boolean;
  path?: string;
}): Promise<{ path: string; base64: string; mimeType: "image/png" }> {
  const page = await getPage();
  mkdirSync(config.screenshotDir, { recursive: true });

  const filePath = resolveScreenshotPath(args.path);

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
