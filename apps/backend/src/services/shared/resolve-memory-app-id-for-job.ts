import { basename } from "node:path";
import {
  extractMemoryAppIdFromUrl,
  resolveMemoryAppId,
  type AutomationPlatform,
  type MobileConfig,
} from "@knitto/shared";
import { getAgentPromptShortcut } from "../../infra/api-data/agent-memory-client.js";
import { loadShortcutRegistry } from "./test-case-shortcut-resolver.js";

export async function resolveMemoryAppIdForJob(args: {
  platform?: AutomationPlatform;
  text: string;
  mobileConfig?: MobileConfig;
  promptBasePaths?: string[];
  apiDataToken?: string;
}): Promise<string | undefined> {
  const platform = args.platform === "mobile" ? "mobile" : "browser";

  const fromJob = resolveMemoryAppId({
    platform,
    appPackage: args.mobileConfig?.appPackage,
    text: args.text,
  });
  if (fromJob) return fromJob;

  if (platform !== "browser" || !args.promptBasePaths?.length) {
    return undefined;
  }

  const token = args.apiDataToken?.trim();
  if (token) {
    for (const path of args.promptBasePaths) {
      const id = basename(path, ".md");
      try {
        const shortcut = await getAgentPromptShortcut(id, token);
        if (!shortcut.url?.trim()) continue;
        const fromUrl = extractMemoryAppIdFromUrl(shortcut.url.trim());
        if (fromUrl) return fromUrl;
      } catch {
        // skip missing shortcut
      }
    }
    return undefined;
  }

  const registry = await loadShortcutRegistry();
  for (const path of args.promptBasePaths) {
    const id = basename(path, ".md");
    const shortcut = registry.find((entry) => entry.id === id);
    if (!shortcut?.url?.trim()) continue;
    const fromUrl = extractMemoryAppIdFromUrl(shortcut.url.trim());
    if (fromUrl) return fromUrl;
  }

  return undefined;
}
