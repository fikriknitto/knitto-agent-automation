import { basename, extname, resolve } from "node:path";
import { existsSync, statSync } from "node:fs";
import type { Browser } from "webdriverio";
import { ToolError } from "../../automation/core/index.js";
import { pushFile } from "./adb/adb-client.js";
import mobileConfig from "./config.js";
import { getAutomationJobId } from "./job-context.js";
import { getMobileJobUdid } from "./mobile-job-context.js";
import { resolveLocator } from "./locators.js";
import { getDriver } from "./driver/session.js";
import type { MobileLocator } from "./schema.js";
import { assertPageOpen } from "./screenshot.js";

const BLOCKED_EXTENSIONS = new Set([
  "exe",
  "bat",
  "cmd",
  "sh",
  "msi",
  "dll",
  "ps1",
  "com",
  "scr",
]);

export async function tapElement(
  locator: MobileLocator,
  clickCenter = true
): Promise<{ success: boolean; locator: MobileLocator }> {
  await assertPageOpen();
  const driver = await getDriver();
  const el = await resolveLocator(driver, locator);

  if (clickCenter) {
    const rect = await el.getLocation();
    const size = await el.getSize();
    const x = rect.x + size.width / 2;
    const y = rect.y + size.height / 2;
    await tapAtCoordinates(driver, x, y);
  } else {
    await el.click();
  }

  return { success: true, locator };
}

export async function tapAtCoordinates(
  driver: Browser,
  x: number,
  y: number
): Promise<{ success: boolean; x: number; y: number }> {
  try {
    await driver.execute("mobile: clickGesture", { x, y });
  } catch {
    await driver.performActions([
      {
        type: "pointer",
        id: "finger1",
        parameters: { pointerType: "touch" },
        actions: [
          { type: "pointerMove", duration: 0, x, y },
          { type: "pointerDown", button: 0 },
          { type: "pause", duration: 50 },
          { type: "pointerUp", button: 0 },
        ],
      },
    ]);
    await driver.releaseActions();
  }
  return { success: true, x, y };
}

export async function tapAt(x: number, y: number): Promise<{ success: boolean; x: number; y: number }> {
  await assertPageOpen();
  const driver = await getDriver();
  return tapAtCoordinates(driver, x, y);
}

export async function scrollScreen(args: {
  direction: "up" | "down" | "top" | "bottom";
  amount?: number;
  locator?: MobileLocator;
}): Promise<{ success: boolean }> {
  await assertPageOpen();
  const driver = await getDriver();
  const amount = args.amount ?? 400;

  let left = 0;
  let top = 0;
  let width = 0;
  let height = 0;

  if (args.locator) {
    const el = await resolveLocator(driver, args.locator);
    const rect = await el.getLocation();
    const size = await el.getSize();
    left = rect.x;
    top = rect.y;
    width = size.width;
    height = size.height;
  } else {
    const win = await driver.getWindowSize();
    left = 0;
    top = 0;
    width = win.width;
    height = win.height;
  }

  const percent = Math.min(100, Math.max(10, Math.round((amount / height) * 100)));
  let direction: string = args.direction;
  if (args.direction === "top") direction = "up";
  if (args.direction === "bottom") direction = "down";

  if (args.direction === "top") {
    await driver.execute("mobile: scrollGesture", {
      left,
      top,
      width,
      height,
      direction: "up",
      percent: 100,
    });
  } else if (args.direction === "bottom") {
    await driver.execute("mobile: scrollGesture", {
      left,
      top,
      width,
      height,
      direction: "down",
      percent: 100,
    });
  } else {
    await driver.execute("mobile: scrollGesture", {
      left,
      top,
      width,
      height,
      direction,
      percent,
    });
  }

  return { success: true };
}

export async function inputText(args: {
  locator: MobileLocator;
  value: string;
  clear?: boolean;
  hideKeyboard?: boolean;
}): Promise<{ success: boolean; locator: MobileLocator }> {
  await assertPageOpen();
  const driver = await getDriver();
  const el = await resolveLocator(driver, args.locator);
  await el.click();
  if (args.clear !== false) {
    await el.clearValue();
  }
  await el.setValue(args.value);
  if (args.hideKeyboard !== false) {
    try {
      await driver.hideKeyboard();
    } catch {
      // ignore
    }
  }
  return { success: true, locator: args.locator };
}

export async function pressMobileKey(
  key: "BACK" | "HOME" | "ENTER" | "TAB" | "DEL" | "MENU"
): Promise<{ success: boolean; key: string }> {
  await assertPageOpen();
  const driver = await getDriver();
  const keyCodeMap: Record<string, number> = {
    BACK: 4,
    HOME: 3,
    ENTER: 66,
    TAB: 61,
    DEL: 67,
    MENU: 82,
  };
  await driver.pressKeyCode(keyCodeMap[key]!);
  return { success: true, key };
}

export async function uploadFileToInput(args: {
  locator: MobileLocator;
  filePath: string;
}): Promise<{
  success: boolean;
  locator: MobileLocator;
  filePath: string;
  fileName: string;
  remotePath: string;
}> {
  const absolutePath = assertSafeUploadPath(args.filePath);
  await assertPageOpen();
  const driver = await getDriver();
  const jobId = getAutomationJobId();
  const udid = jobId ? getMobileJobUdid(jobId) : undefined;
  if (!udid) {
    throw new ToolError("Device UDID tidak tersedia untuk upload.");
  }

  const fileName = basename(absolutePath);
  const remotePath = `/sdcard/Download/knitto-uploads/${fileName}`;
  await pushFile(udid, absolutePath, remotePath);

  const el = await resolveLocator(driver, args.locator);
  await el.click();
  try {
    await el.setValue(remotePath);
  } catch {
    await el.addValue(remotePath);
  }

  return {
    success: true,
    locator: args.locator,
    filePath: absolutePath,
    fileName,
    remotePath,
  };
}

export async function assertVisible(
  locator: MobileLocator
): Promise<{ success: boolean; locator: MobileLocator; visible: boolean }> {
  await assertPageOpen();
  const driver = await getDriver();
  const el = await resolveLocator(driver, locator);
  const visible = await el.isDisplayed();
  if (!visible) {
    throw new ToolError(`Element not visible: ${JSON.stringify(locator)}`);
  }
  return { success: true, locator, visible: true };
}

export async function waitFor(args: {
  type: "locator" | "text" | "timeout";
  text?: string;
  locator?: MobileLocator;
  timeoutMs?: number;
}): Promise<{ success: boolean; type: "locator" | "text" | "timeout" }> {
  await assertPageOpen();
  const driver = await getDriver();
  const timeout = args.timeoutMs ?? 10_000;

  if (args.type === "timeout") {
    await driver.pause(timeout);
    return { success: true, type: "timeout" };
  }

  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (args.type === "locator" && args.locator) {
      try {
        const el = await resolveLocator(driver, args.locator);
        if (await el.isDisplayed()) {
          return { success: true, type: "locator" };
        }
      } catch {
        // keep polling
      }
    }
    if (args.type === "text" && args.text) {
      const source = await driver.getPageSource();
      if (source.includes(args.text)) {
        return { success: true, type: "text" };
      }
    }
    await driver.pause(300);
  }

  throw new ToolError(`Wait timed out after ${timeout}ms`);
}

function assertSafeUploadPath(filePath: string): string {
  const absolutePath = resolve(filePath);
  if (!existsSync(absolutePath)) {
    throw new ToolError(`File not found: ${absolutePath}`);
  }
  const stats = statSync(absolutePath);
  if (!stats.isFile()) {
    throw new ToolError(`Path is not a file: ${absolutePath}`);
  }
  if (stats.size > mobileConfig.uploadMaxBytes) {
    throw new ToolError(
      `File exceeds max upload size (${mobileConfig.uploadMaxBytes} bytes): ${absolutePath}`
    );
  }
  const ext = extname(absolutePath).slice(1).toLowerCase();
  if (ext && BLOCKED_EXTENSIONS.has(ext)) {
    throw new ToolError(`Blocked file extension ".${ext}"`);
  }
  return absolutePath;
}
