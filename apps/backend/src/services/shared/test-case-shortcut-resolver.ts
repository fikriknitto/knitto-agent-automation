import type { ShortcutRegistryEntry } from "@knitto/shared";
import { shortcutToRegistryEntry } from "@knitto/shared";
import { listPromptShortcuts } from "../prompt-shortcut-service.js";

export async function loadShortcutRegistry(): Promise<ShortcutRegistryEntry[]> {
  const shortcuts = await listPromptShortcuts();
  return shortcuts.map((shortcut) =>
    shortcutToRegistryEntry({
      id: shortcut.id,
      label: shortcut.label,
      platform: shortcut.platform,
      appPackage: shortcut.appPackage,
      url: shortcut.url,
      deepLink: shortcut.deepLink,
      template: shortcut.template,
      defaults: shortcut.defaults,
    })
  );
}
