export function mergePromptParts(bases: string[], main: string): string {
  return [...bases.map((b) => b.trim()).filter(Boolean), main.trim()]
    .filter(Boolean)
    .join("\n\n");
}

/** Relative path from monorepo root, e.g. prompt-shortcuts/login.md */
export function toPromptShortcutRelativePath(id: string): string {
  return `prompt-shortcuts/${id}.md`;
}
