import type { ShortcutRegistryEntry } from "@knitto/shared";
import { shortcutToRegistryEntry } from "@knitto/shared";
import { listAgentPromptShortcuts } from "../../infra/api-data/agent-memory-client.js";
import { listPromptShortcuts } from "../../modules/prompt-shortcut/prompt-shortcut-service.js";

function isEnoent(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as NodeJS.ErrnoException).code === "ENOENT"
  );
}

export async function loadShortcutRegistry(
  apiDataToken?: string | null
): Promise<ShortcutRegistryEntry[]> {
  const token = apiDataToken?.trim();
  if (token) {
    const shortcuts = await listAgentPromptShortcuts(token);
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

  // Legacy disk fallback (deprecated — folder may be absent after W5 migration).
  try {
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
  } catch (error) {
    if (isEnoent(error)) {
      return [];
    }
    throw error;
  }
}
