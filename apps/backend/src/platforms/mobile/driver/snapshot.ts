import { XMLParser } from "fast-xml-parser";
import type { Browser } from "webdriverio";
import mobileConfig from "../config.js";
import { getAutomationJobId } from "../job-context.js";
import { getMobileJobUdid } from "../session/mobile-job-context.js";

export type SnapshotElement = {
  ref: string;
  className: string | null;
  text: string | null;
  contentDesc: string | null;
  resourceId: string | null;
  clickable: boolean;
  editable: boolean;
  enabled: boolean;
  bbox: { x: number; y: number; width: number; height: number } | null;
  xpath: string;
};

const refMap = new Map<string, string>();
let refCounter = 0;

function resetRefs(): void {
  refMap.clear();
  refCounter = 0;
}

function parseBounds(bounds: string | undefined): SnapshotElement["bbox"] {
  if (!bounds) return null;
  const match = bounds.match(/\[(\d+),(\d+)\]\[(\d+),(\d+)\]/);
  if (!match) return null;
  const left = Number(match[1]);
  const top = Number(match[2]);
  const right = Number(match[3]);
  const bottom = Number(match[4]);
  return { x: left, y: top, width: right - left, height: bottom - top };
}

function walkNode(
  node: Record<string, unknown>,
  elements: SnapshotElement[],
  interactiveOnly: boolean,
  maxElements: number,
  xpath: string
): void {
  if (elements.length >= maxElements) return;

  const attrs = (node["@_"] as Record<string, string> | undefined) ?? node;
  const className = String(attrs.class ?? attrs["class"] ?? "");
  const text = attrs.text ? String(attrs.text) : null;
  const contentDesc = attrs["content-desc"] ? String(attrs["content-desc"]) : null;
  const resourceId = attrs["resource-id"] ? String(attrs["resource-id"]) : null;
  const clickable = attrs.clickable === "true" || attrs.clickable === true;
  const editable = attrs.editable === "true" || attrs.editable === true;
  const enabled = attrs.enabled !== "false";
  const bounds = parseBounds(attrs.bounds ? String(attrs.bounds) : undefined);

  const isInteractive = clickable || editable;
  if (!interactiveOnly || isInteractive) {
    refCounter += 1;
    const ref = `e${refCounter}`;
    const entry: SnapshotElement = {
      ref,
      className: className || null,
      text,
      contentDesc,
      resourceId,
      clickable,
      editable,
      enabled,
      bbox: bounds,
      xpath,
    };
    refMap.set(ref, xpath);
    elements.push(entry);
  }

  const children = node.node;
  if (!children) return;
  const childList = Array.isArray(children) ? children : [children];
  childList.forEach((child, index) => {
    if (child && typeof child === "object") {
      walkNode(
        child as Record<string, unknown>,
        elements,
        interactiveOnly,
        maxElements,
        `${xpath}/node[${index + 1}]`
      );
    }
  });
}

export function getRefXpath(ref: string): string | undefined {
  return refMap.get(ref);
}

export async function captureScreenSnapshot(
  driver: Browser,
  opts: { interactiveOnly?: boolean; maxElements?: number } = {}
): Promise<{
  package: string | null;
  activity: string | null;
  udid: string | null;
  elements: Omit<SnapshotElement, "xpath">[];
}> {
  const interactiveOnly = opts.interactiveOnly ?? true;
  const maxElements = opts.maxElements ?? mobileConfig.snapshotMaxElements;

  resetRefs();
  const xml = await driver.getPageSource();
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
  });
  const parsed = parser.parse(xml) as Record<string, unknown>;
  const hierarchy = (parsed.hierarchy ?? parsed) as Record<string, unknown>;

  const elements: SnapshotElement[] = [];
  const root = hierarchy.node ?? hierarchy;
  if (root && typeof root === "object") {
    walkNode(root as Record<string, unknown>, elements, interactiveOnly, maxElements, "//hierarchy/node");
  }

  const jobId = getAutomationJobId();
  let pkg: string | null = null;
  let activity: string | null = null;
  let udid: string | null = jobId ? (getMobileJobUdid(jobId) ?? null) : null;

  try {
    pkg = await driver.getCurrentPackage();
  } catch {
    // ignore
  }
  try {
    activity = await driver.getCurrentActivity();
  } catch {
    // ignore
  }

  return {
    package: pkg,
    activity,
    udid,
    elements: elements.map(({ xpath: _x, ...rest }) => rest),
  };
}
