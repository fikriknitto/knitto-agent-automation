import { readFileSync } from "node:fs";

const INSTANCE_NAME_PATTERN = /bst\.instance\.([^.]+)\.display_name/g;

export function parseInstanceNames(configContents: string): string[] {
  const names = new Set<string>();

  for (const match of configContents.matchAll(INSTANCE_NAME_PATTERN)) {
    const name = match[1]?.trim();
    if (name) names.add(name);
  }

  return [...names].sort((a, b) => a.localeCompare(b));
}

export function readInstanceNames(configPath: string): string[] {
  const contents = readFileSync(configPath, "utf8");
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
