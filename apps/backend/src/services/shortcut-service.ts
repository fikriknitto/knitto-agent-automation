import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { resolveMonorepoRoot, resolvePromptShortcutsDir } from "../config/paths.js";

export type PromptShortcutDto = {
  id: string;
  label: string;
  icon: string;
  variant: string;
  order: number;
  template: string;
  defaults: Record<string, string>;
};

type Frontmatter = {
  label?: string;
  icon?: string;
  variant?: string;
  order?: string | number;
  defaults?: Record<string, string>;
};

function stripQuotes(value: string): string {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

function parseFrontmatter(raw: string): { meta: Frontmatter; body: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) {
    return { meta: {}, body: raw.trim() };
  }

  const meta: Frontmatter = { defaults: {} };
  let inDefaults = false;

  for (const line of match[1]!.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (trimmed === "defaults:") {
      inDefaults = true;
      continue;
    }

    if (inDefaults) {
      const nested = line.match(/^\s{2,}(\w+):\s*(.*)$/);
      if (nested) {
        meta.defaults![nested[1]!] = stripQuotes(nested[2]!.trim());
        continue;
      }
      if (!line.startsWith(" ") && trimmed.includes(":")) {
        inDefaults = false;
      } else {
        continue;
      }
    }

    const top = trimmed.match(/^(\w+):\s*(.*)$/);
    if (top) {
      const key = top[1]!;
      const value = stripQuotes(top[2]!.trim());
      if (key === "order") {
        meta.order = Number(value) || 0;
      } else if (key === "label" || key === "icon" || key === "variant") {
        meta[key] = value;
      }
    }
  }

  return { meta, body: match[2]!.trim() };
}

function titleFromFilename(name: string): string {
  return name.replace(/\.md$/, "").replace(/-/g, " ");
}

export async function listPromptShortcuts(): Promise<PromptShortcutDto[]> {
  const root = resolveMonorepoRoot();
  const dir = resolvePromptShortcutsDir(root);
  const entries = await readdir(dir);
  const shortcuts: PromptShortcutDto[] = [];

  for (const file of entries) {
    if (!file.endsWith(".md")) continue;
    const raw = await readFile(join(dir, file), "utf8");
    const { meta, body } = parseFrontmatter(raw);
    const id = file.replace(/\.md$/, "");

    shortcuts.push({
      id,
      label: meta.label ?? titleFromFilename(file),
      icon: meta.icon ?? "",
      variant: meta.variant ?? "neutral",
      order: typeof meta.order === "number" ? meta.order : Number(meta.order) || 0,
      template: body,
      defaults: meta.defaults ?? {},
    });
  }

  return shortcuts.sort((a, b) => a.order - b.order || a.label.localeCompare(b.label));
}
