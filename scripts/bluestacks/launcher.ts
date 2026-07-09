import { spawn } from "node:child_process";
import type { LaunchOptions } from "./config.js";
import { assertBlueStacksPaths } from "./config.js";
import { writeLaunchState } from "./launch-state.js";
import {
  filterInstances,
  limitInstances,
  parseInstanceNames,
  readConfigContents,
} from "./instances.js";

export type LaunchSummary = {
  launched: string[];
  skipped: string[];
  failed: Array<{ instance: string; reason: string }>;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function launchInstance(playerPath: string, instance: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(playerPath, ["--instance", instance], {
      detached: true,
      stdio: "ignore",
      windowsHide: true,
    });

    child.once("error", reject);
    child.once("spawn", () => {
      child.unref();
      resolve();
    });
  });
}

export async function startBlueStacksInstances(options: LaunchOptions): Promise<LaunchSummary> {
  assertBlueStacksPaths(options.paths);

  const configContents = readConfigContents(options.paths.configPath);
  const discovered = parseInstanceNames(configContents);
  if (!discovered.length) {
    throw new Error(`No BlueStacks instances found in ${options.paths.configPath}`);
  }

  const filtered = filterInstances(discovered, options.only);
  const targets = limitInstances(filtered, options.count);
  if (options.count !== undefined && targets.length < filtered.length) {
    console.log(
      `Starting ${targets.length} of ${filtered.length} instance(s) (--count ${options.count})`
    );
  }

  if (options.dryRun) {
    console.log(`[dry-run] Would start ${targets.length} instance(s):`);
    for (const instance of targets) {
      console.log(`  - ${instance}`);
    }
    console.log("Then run: pnpm connect:instances");
    return { launched: [], skipped: targets, failed: [] };
  }

  const launched: string[] = [];
  const failed: LaunchSummary["failed"] = [];

  for (const [index, instance] of targets.entries()) {
    if (index > 0 && options.delayMs > 0) {
      await sleep(options.delayMs);
    }

    try {
      await launchInstance(options.paths.playerPath, instance);
      launched.push(instance);
      console.log(`Started: ${instance}`);
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      failed.push({ instance, reason: `launch failed: ${reason}` });
      console.error(`Failed to start ${instance}: ${reason}`);
    }
  }

  if (launched.length) {
    writeLaunchState(launched, options.adbHost);
    console.log(`Saved launch state (${launched.length} instance(s)) → .bluestacks/last-launched.json`);
  }

  console.log(`Done. Launched ${launched.length}/${targets.length}.`);
  if (failed.length) {
    console.log(`Failures: ${failed.length}`);
  }
  if (launched.length) {
    console.log("Next: pnpm connect:instances");
  }

  return { launched, skipped: [], failed };
}
