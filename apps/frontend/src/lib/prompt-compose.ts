import type { PromptShortcutVariant } from "./prompt-shortcuts";

export type { PromptShortcutVariant };
export { mergePromptParts } from "@knitto/shared";

export type AppliedPromptShortcut = {
  id: string;
  label: string;
  icon: string;
  variant: PromptShortcutVariant;
  filledText: string;
};
