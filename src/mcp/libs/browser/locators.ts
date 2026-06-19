import type { Page } from "puppeteer";
import { ToolError } from "../../core/index.js";
import type { SemanticLocator } from "../schema.js";

export type RefEntry = {
  selector: string;
  index: number;
};

const refMap = new Map<string, RefEntry>();

export function clearRefMap(): void {
  refMap.clear();
}

export function registerRefs(entries: Array<{ ref: string; selector: string; index: number }>): void {
  refMap.clear();
  for (const entry of entries) {
    refMap.set(entry.ref, { selector: entry.selector, index: entry.index });
  }
}

export function getRefEntry(ref: string): RefEntry | undefined {
  return refMap.get(ref);
}

function escapeXPathText(text: string): string {
  if (!text.includes("'")) return `'${text}'`;
  if (!text.includes('"')) return `"${text}"`;
  return `concat('${text.replace(/'/g, "',\"'\",'")}')`;
}

async function resolveByRef(page: Page, ref: string) {
  const entry = refMap.get(ref);
  if (!entry) {
    throw new ToolError(`Unknown ref "${ref}". Call automation_get_page_snapshot first.`);
  }
  const handles = await page.$$(entry.selector);
  const handle = handles[entry.index];
  if (!handle) {
    throw new ToolError(`Ref "${ref}" no longer matches an element on the page.`);
  }
  return handle;
}

async function resolveByRoleName(page: Page, role: string, name?: string) {
  const roleLower = role.toLowerCase();
  const tagAliases: Record<string, string> = {
    button: "button",
    link: "a",
    textbox: "input",
    combobox: "select",
    checkbox: "input",
    option: "option",
    menuitem: "a",
  };
  const tag = tagAliases[roleLower] ?? roleLower;
  const xpath = name
    ? `//*[@role="${roleLower}" and contains(normalize-space(.), ${escapeXPathText(name)})] | //${tag}[contains(normalize-space(.), ${escapeXPathText(name)})]`
    : `//*[@role="${roleLower}"] | //${tag}`;
  const handles = await page.$$(`xpath/${xpath}`);
  if (!handles.length) {
    throw new ToolError(
      `No element found for role="${role}"${name ? ` name="${name}"` : ""}.`
    );
  }
  if (handles.length > 1 && name) {
    throw new ToolError(
      `Ambiguous locator role="${role}" name="${name}" (${handles.length} matches). Use get_page_snapshot ref.`
    );
  }
  return handles[0]!;
}

async function resolveByPlaceholder(page: Page, placeholder: string) {
  const handles = await page.$$(`[placeholder="${placeholder.replace(/"/g, '\\"')}"]`);
  if (!handles.length) {
    throw new ToolError(`No input found with placeholder="${placeholder}".`);
  }
  return handles[0]!;
}

async function resolveByLabel(page: Page, label: string) {
  const forIds = await page.evaluate((labelText) => {
    const xpath = `//label[contains(normalize-space(.), '${labelText.replace(/'/g, "\\'")}')]`;
    const result = document.evaluate(xpath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    const ids: string[] = [];
    for (let i = 0; i < result.snapshotLength; i++) {
      const node = result.snapshotItem(i);
      if (node instanceof HTMLLabelElement && node.htmlFor) ids.push(node.htmlFor);
    }
    return ids;
  }, label);

  if (forIds.length) {
    const handle = await page.$(`#${CSS.escape(forIds[0]!)}`);
    if (handle) return handle;
  }

  const labeled = await page.$$(
    `xpath=//label[contains(normalize-space(.), ${escapeXPathText(label)})]//input | //label[contains(normalize-space(.), ${escapeXPathText(label)})]//textarea | //label[contains(normalize-space(.), ${escapeXPathText(label)})]//select`
  );
  if (!labeled.length) {
    throw new ToolError(`No element found for label="${label}".`);
  }
  return labeled[0]!;
}

async function resolveByText(page: Page, text: string) {
  const xpath = `//*[not(self::script or self::style) and contains(normalize-space(.), ${escapeXPathText(text)})]`;
  const handles = await page.$$(`xpath/${xpath}`);
  if (!handles.length) {
    throw new ToolError(`No element found containing text="${text}".`);
  }
  if (handles.length > 1) {
    throw new ToolError(
      `Ambiguous text locator "${text}" (${handles.length} matches). Use snapshot ref or role+name.`
    );
  }
  return handles[0]!;
}

export async function resolveOptionByText(page: Page, text: string) {
  const xpath = `//*[self::option or self::li or @role='option' or @role='menuitem'][contains(normalize-space(.), ${escapeXPathText(text)})]`;
  const handles = await page.$$(`xpath/${xpath}`);
  if (!handles.length) {
    throw new ToolError(`No option found matching "${text}".`);
  }
  return handles[0]!;
}

export async function resolveLocator(page: Page, locator: SemanticLocator) {
  if (locator.ref) return resolveByRef(page, locator.ref);
  if (locator.role) return resolveByRoleName(page, locator.role, locator.name);
  if (locator.placeholder) return resolveByPlaceholder(page, locator.placeholder);
  if (locator.label) return resolveByLabel(page, locator.label);
  if (locator.text) return resolveByText(page, locator.text);
  throw new ToolError(
    "Locator requires ref, role (+optional name), label, placeholder, or text. Do not use data-testid."
  );
}

export async function isLocatorVisible(page: Page, locator: SemanticLocator): Promise<boolean> {
  const handle = await resolveLocator(page, locator);
  return handle.evaluate((el) => {
    const style = window.getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    return (
      style.visibility !== "hidden" &&
      style.display !== "none" &&
      rect.width > 0 &&
      rect.height > 0
    );
  });
}
