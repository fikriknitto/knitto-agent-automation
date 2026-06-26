export function mergePromptParts(bases: string[], main: string): string {
  return [...bases.map((b) => b.trim()).filter(Boolean), main.trim()]
    .filter(Boolean)
    .join("\n\n");
}
