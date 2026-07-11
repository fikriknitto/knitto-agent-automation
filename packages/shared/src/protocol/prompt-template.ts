export function resolveDefaultValue(
  defaults: Record<string, string>,
  key: string
): string | undefined {
  if (key in defaults) return defaults[key];
  const lowerKey = key.toLowerCase();
  const match = Object.keys(defaults).find((k) => k.toLowerCase() === lowerKey);
  return match ? defaults[match] : undefined;
}

export function fillPromptTemplate(
  template: string,
  defaults: Record<string, string>
): string {
  return template.replace(/\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g, (_, key: string) => {
    const value = resolveDefaultValue(defaults, key);
    if (value !== undefined && value.trim() !== "") {
      return value;
    }
    return `{${key}}`;
  });
}

export function extractTemplatePlaceholders(template: string): Record<string, string> {
  const defaults: Record<string, string> = {};
  const matches = template.matchAll(/\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g);
  for (const match of matches) {
    const key = match[1]!;
    if (!(key in defaults)) defaults[key] = "";
  }
  return defaults;
}

export function findUnresolvedPlaceholders(text: string): string[] {
  const unresolved = new Set<string>();
  const matches = text.matchAll(/\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g);
  for (const match of matches) {
    unresolved.add(match[1]!);
  }
  return [...unresolved];
}
