import { readFileSync } from "node:fs";

const INSTANCE_NAME_PATTERN = /bst\.instance\.([^.]+)\.display_name/g;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function readConfigContents(configPath: string): string {
  return readFileSync(configPath, "utf8");
}

export function parseInstanceNames(configContents: string): string[] {
  const names = new Set<string>();

  for (const match of configContents.matchAll(INSTANCE_NAME_PATTERN)) {
    const name = match[1]?.trim();
    if (name) names.add(name);
  }

  return [...names].sort((a, b) => a.localeCompare(b));
}

export function readInstanceNames(configPath: string): string[] {
  const contents = readConfigContents(configPath);
  const names = parseInstanceNames(contents);

  if (!names.length) {
    throw new Error(`No BlueStacks instances found in ${configPath}`);
  }

  return names;
}

export function filterInstances(all: string[], only: string[] | undefined): string[] {
  if (!only?.length) return all;

  const known = new Set(all);
  const missing = only.filter((name) => !known.has(name));
  if (missing.length) {
    throw new Error(
      `Unknown instance(s): ${missing.join(", ")}. Available: ${all.join(", ")}`
    );
  }

  return only;
}

export function limitInstances(instances: string[], count: number | undefined): string[] {
  if (count === undefined) return instances;
  if (count >= instances.length) return instances;
  return instances.slice(0, count);
}

export function parseInstanceAdbPort(
  configContents: string,
  instance: string
): number | undefined {
  const pattern = new RegExp(
    `bst\\.instance\\.${escapeRegExp(instance)}\\.adb_port="(\\d+)"`
  );
  const match = configContents.match(pattern);
  if (!match?.[1]) return undefined;
  const port = Number(match[1]);
  return Number.isInteger(port) && port > 0 ? port : undefined;
}

export function readInstanceAdbPort(configPath: string, instance: string): number | undefined {
  return parseInstanceAdbPort(readConfigContents(configPath), instance);
}
