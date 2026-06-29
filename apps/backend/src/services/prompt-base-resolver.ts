import { access } from "node:fs/promises";
import { basename, relative, resolve } from "node:path";
import { resolvePromptShortcutsDir } from "../config/paths.js";
import { promptShortcutIdSchema } from "../validators/prompt-shortcut-schemas.js";

export class PromptBaseNotFoundError extends Error {
  constructor(input: string) {
    super(`Prompt base file not found: ${input}`);
    this.name = "PromptBaseNotFoundError";
  }
}

export class PromptBaseInvalidPathError extends Error {
  constructor(input: string) {
    super(`Invalid prompt base path: ${input}`);
    this.name = "PromptBaseInvalidPathError";
  }
}

function normalizeInput(input: string): string {
  const trimmed = input.trim().replace(/\\/g, "/");
  if (!trimmed) {
    throw new PromptBaseInvalidPathError(input);
  }

  if (trimmed.startsWith("prompt-shortcuts/")) {
    const name = basename(trimmed);
    if (!name.endsWith(".md")) {
      throw new PromptBaseInvalidPathError(input);
    }
    return name.slice(0, -3);
  }

  if (trimmed.endsWith(".md")) {
    return basename(trimmed, ".md");
  }

  return trimmed;
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

/** Resolve relative WS path or shortcut id to absolute file path under prompt-shortcuts/. */
export async function resolvePromptBasePath(input: string): Promise<string> {
  const id = normalizeInput(input);
  const parsed = promptShortcutIdSchema.safeParse(id);
  if (!parsed.success) {
    throw new PromptBaseInvalidPathError(input);
  }

  const dir = resolvePromptShortcutsDir();
  const absolutePath = resolve(dir, `${parsed.data}.md`);
  const resolvedDir = resolve(dir);
  const rel = relative(resolvedDir, absolutePath);

  if (rel.startsWith("..") || rel.includes("..")) {
    throw new PromptBaseInvalidPathError(input);
  }

  if (!(await fileExists(absolutePath))) {
    throw new PromptBaseNotFoundError(input);
  }

  return absolutePath;
}

export async function resolvePromptBasePaths(inputs: string[]): Promise<string[]> {
  const unique = [...new Set(inputs.map((item) => item.trim()).filter(Boolean))];
  return Promise.all(unique.map((input) => resolvePromptBasePath(input)));
}
