import { request, requestVoid } from "../http/client";
import type {
  GeneratePromptShortcutInput,
  GeneratePromptShortcutResult,
  PromptShortcut,
  PromptShortcutVariant,
  PromptShortcutWriteInput,
} from "../prompt-shortcuts/types";

const API_BASE = "/api/prompt-shortcuts";
const VARIANTS = new Set<PromptShortcutVariant>(["blue", "green", "amber", "neutral"]);

function resolveVariant(value?: string): PromptShortcutVariant {
  if (value && VARIANTS.has(value as PromptShortcutVariant)) {
    return value as PromptShortcutVariant;
  }
  return "neutral";
}

function normalizePromptShortcut(item: PromptShortcut): PromptShortcut {
  return {
    ...item,
    variant: resolveVariant(item.variant),
  };
}

export async function listPromptShortcuts(): Promise<PromptShortcut[]> {
  const data = await request<{ promptShortcuts: PromptShortcut[] }>(API_BASE);
  return data.promptShortcuts.map(normalizePromptShortcut);
}

export async function getPromptShortcut(id: string): Promise<PromptShortcut> {
  const data = await request<{ promptShortcut: PromptShortcut }>(
    `${API_BASE}/${encodeURIComponent(id)}`
  );
  return normalizePromptShortcut(data.promptShortcut);
}

export async function createPromptShortcut(
  input: PromptShortcutWriteInput
): Promise<PromptShortcut> {
  const data = await request<{ promptShortcut: PromptShortcut }>(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return normalizePromptShortcut(data.promptShortcut);
}

export async function updatePromptShortcut(
  id: string,
  input: PromptShortcutWriteInput
): Promise<PromptShortcut> {
  const data = await request<{ promptShortcut: PromptShortcut }>(
    `${API_BASE}/${encodeURIComponent(id)}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }
  );
  return normalizePromptShortcut(data.promptShortcut);
}

export async function deletePromptShortcut(id: string): Promise<void> {
  await requestVoid(`${API_BASE}/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export async function generatePromptShortcutTemplate(
  input: GeneratePromptShortcutInput
): Promise<GeneratePromptShortcutResult> {
  return request<GeneratePromptShortcutResult>(`${API_BASE}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}
