import { mkdirSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import { resolveAgentScreenshotDir } from "./job-context.js";
import mobileConfig from "./config.js";
import { getDriver } from "./driver/session.js";

export async function takeMobileScreenshot(path?: string): Promise<{
  path: string;
  base64: string;
  mimeType: "image/png";
}> {
  const driver = await getDriver();
  const base64 = await driver.takeScreenshot();
  const dir = resolveAgentScreenshotDir(mobileConfig.screenshotDir);
  mkdirSync(dir, { recursive: true });

  const filename = path?.trim()
    ? basename(path.trim()).replace(/[^a-zA-Z0-9._-]/g, "_")
    : `screenshot-${Date.now()}.png`;
  const filePath = join(dir, filename.endsWith(".png") ? filename : `${filename}.png`);
  writeFileSync(filePath, Buffer.from(base64, "base64"));

  return { path: filePath, base64, mimeType: "image/png" };
}

export async function assertPageOpen(): Promise<void> {
  await getDriver();
}
