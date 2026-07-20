import type { Browser, ChainablePromiseElement } from "webdriverio";
import { ToolError } from "../../browser/core/index.js";
import { getRefXpath } from "./snapshot.js";
import type { MobileLocator } from "../schema.js";

function buildUiSelector(locator: MobileLocator): string {
  const parts: string[] = ["new UiSelector()"];
  if (locator.accessibilityId) {
    parts.push(`.descriptionContains("${locator.accessibilityId.replace(/"/g, '\\"')}")`);
  }
  if (locator.text) {
    parts.push(`.textContains("${locator.text.replace(/"/g, '\\"')}")`);
  }
  if (locator.name) {
    parts.push(`.resourceIdMatches(".*${locator.name.replace(/"/g, '\\"')}.*")`);
  }
  return parts.join("");
}

export async function resolveLocator(
  driver: Browser,
  locator: MobileLocator
): Promise<ChainablePromiseElement> {
  if (locator.ref) {
    const xpath = getRefXpath(locator.ref);
    if (!xpath) {
      throw new ToolError(`Unknown ref "${locator.ref}" — call mobile_get_screen_snapshot first.`);
    }
    const el = await driver.$(xpath);
    if (!(await el.isExisting())) {
      throw new ToolError(`Element ref "${locator.ref}" not found on screen.`);
    }
    return el;
  }

  const hasField =
    locator.accessibilityId || locator.text || locator.name;
  if (!hasField) {
    throw new ToolError("Locator must include ref, accessibilityId, text, or name.");
  }

  const selector = buildUiSelector(locator);
  const el = await driver.$(`android=${selector}`);
  if (!(await el.isExisting())) {
    throw new ToolError(`No element matched locator: ${JSON.stringify(locator)}`);
  }
  return el;
}
