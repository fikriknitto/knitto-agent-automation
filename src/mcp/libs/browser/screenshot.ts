import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { randomBytes } from "node:crypto";
import config from "../config.js";
import { getPage } from "./session.js";

export async function takePageScreenshot(args: {
  fullPage: boolean;
  path?: string;
}): Promise<{ path: string; base64: string; mimeType: "image/png" }> {
  const page = await getPage();
  mkdirSync(config.screenshotDir, { recursive: true });

  const filePath =
    args.path?.trim() ||
    join(config.screenshotDir, `shot-${Date.now()}-${randomBytes(3).toString("hex")}.png`);

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
