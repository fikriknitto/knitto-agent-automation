import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { resolveAgentScreenshotDirForJob } from "../../automation/libs/job-context.js";
import {
  getAgentPromptShortcut,
  type ApiPromptShortcut,
} from "../../infra/api-data/agent-memory-client.js";
import { serializePromptShortcutMarkdown } from "../../services/prompt-shortcut-service.js";
import {
  PromptBaseInvalidPathError,
  PromptBaseNotFoundError,
  resolvePromptBasePaths,
} from "./prompt-base-resolver.js";
import { promptShortcutIdSchema } from "../../validators/prompt-shortcut-schemas.js";

function normalizeShortcutId(input: string): string {
  const trimmed = input.trim().replace(/\\/g, "/");
  if (!trimmed) throw new PromptBaseInvalidPathError(input);

  if (trimmed.startsWith("prompt-shortcuts/")) {
    const name = trimmed.split("/").pop() ?? "";
    if (!name.endsWith(".md")) throw new PromptBaseInvalidPathError(input);
    return name.slice(0, -3);
  }
  if (trimmed.endsWith(".md")) {
    const base = trimmed.split("/").pop() ?? trimmed;
    return base.slice(0, -3);
  }
  return trimmed;
}

function toMarkdown(shortcut: ApiPromptShortcut): string {
  return serializePromptShortcutMarkdown({
    label: shortcut.label,
    icon: shortcut.icon ?? "",
    variant: shortcut.variant ?? "neutral",
    platform: shortcut.platform === "mobile" ? "mobile" : "browser",
    appPackage: shortcut.appPackage,
    url: shortcut.url,
    deepLink: shortcut.deepLink,
    template: shortcut.template,
    defaults: shortcut.defaults ?? {},
  });
}

/** Fetch shortcut bodies from API Data and write under job temp for agent path refs. */
export async function materializePromptBasePathsFromApi(
  inputs: string[],
  opts: { token: string; jobId: string }
): Promise<string[]> {
  const unique = [...new Set(inputs.map((item) => item.trim()).filter(Boolean))];
  const dir = join(resolveAgentScreenshotDirForJob(opts.jobId), "prompt-shortcuts");
  await mkdir(dir, { recursive: true });

  const paths: string[] = [];
  for (const input of unique) {
    const id = normalizeShortcutId(input);
    const parsed = promptShortcutIdSchema.safeParse(id);
    if (!parsed.success) {
      throw new PromptBaseInvalidPathError(input);
    }
    let shortcut: ApiPromptShortcut;
    try {
      shortcut = await getAgentPromptShortcut(parsed.data, opts.token);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (/tidak ditemukan|not found|404/i.test(msg)) {
        throw new PromptBaseNotFoundError(input);
      }
      throw error;
    }
    const absolutePath = join(dir, `${parsed.data}.md`);
    await writeFile(absolutePath, toMarkdown(shortcut), "utf8");
    paths.push(absolutePath);
  }
  return paths;
}

/**
 * Prefer API Data materialization when JWT present; else disk `prompt-shortcuts/`.
 */
export async function resolvePromptBasePathsForJob(
  inputs: string[],
  opts: { apiDataToken?: string; jobId: string }
): Promise<string[]> {
  const token = opts.apiDataToken?.trim();
  if (token) {
    return materializePromptBasePathsFromApi(inputs, {
      token,
      jobId: opts.jobId,
    });
  }
  if (inputs.length) {
    throw new PromptBaseNotFoundError(
      "Prompt shortcut base membutuhkan login API Data — folder prompt-shortcuts/ lokal sudah tidak dipakai."
    );
  }
  return resolvePromptBasePaths(inputs);
}
