export type PromptShortcutVariant = "blue" | "green" | "amber" | "neutral";

export type PromptShortcut = {
  id: string;
  label: string;
  icon: string;
  variant: PromptShortcutVariant;
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

const VARIANTS = new Set<PromptShortcutVariant>(["blue", "green", "amber", "neutral"]);

const rawModules = import.meta.glob<string>("../../prompt-shortcuts/*.md", {
  eager: true,
  query: "?raw",
  import: "default",
});

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

function stripQuotes(value: string): string {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

function titleFromFilename(path: string): string {
  const base = path.split("/").pop()?.replace(/\.md$/, "") ?? "shortcut";
  return base.replace(/-/g, " ");
}

function resolveVariant(value?: string): PromptShortcutVariant {
  if (value && VARIANTS.has(value as PromptShortcutVariant)) {
    return value as PromptShortcutVariant;
  }
  return "neutral";
}

export function fillPromptTemplate(
  template: string,
  defaults: Record<string, string>
): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => defaults[key] ?? `{${key}}`);
}

function loadShortcuts(): PromptShortcut[] {
  return Object.entries(rawModules)
    .map(([path, rawContent]) => {
      const raw = String(rawContent);
      const { meta, body } = parseFrontmatter(raw);
      const id = path.split("/").pop()?.replace(/\.md$/, "") ?? path;

      return {
        id,
        label: meta.label ?? titleFromFilename(path),
        icon: meta.icon ?? "",
        variant: resolveVariant(meta.variant),
        order: typeof meta.order === "number" ? meta.order : Number(meta.order) || 0,
        template: body,
        defaults: meta.defaults ?? {},
      };
    })
    .sort((a, b) => a.order - b.order || a.label.localeCompare(b.label));
}

export const PROMPT_SHORTCUTS = loadShortcuts();
