import type { AgentJobMessage } from "@knitto/shared";

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

const VARIANTS = new Set<PromptShortcutVariant>(["blue", "green", "amber", "neutral"]);

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

let cachedShortcuts: PromptShortcut[] | null = null;

export async function loadPromptShortcuts(): Promise<PromptShortcut[]> {
  if (cachedShortcuts) return cachedShortcuts;

  const response = await fetch("/api/shortcuts");
  if (!response.ok) {
    throw new Error(`Failed to load shortcuts: ${response.status}`);
  }

  const data = (await response.json()) as { shortcuts: PromptShortcut[] };
  cachedShortcuts = data.shortcuts.map((s) => ({
    ...s,
    variant: resolveVariant(s.variant),
  }));
  return cachedShortcuts;
}

export type { AgentJobMessage };
