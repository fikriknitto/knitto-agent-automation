import { spawn } from "node:child_process";
import type { LaunchOptions } from "./config.js";
import { assertBlueStacksPaths } from "./config.js";
import { filterInstances, readInstanceNames } from "./instances.js";

export type LaunchSummary = {
  launched: string[];
  skipped: string[];
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

  const discovered = readInstanceNames(options.paths.configPath);
  const targets = filterInstances(discovered, options.only);

  if (options.dryRun) {
    console.log(`[dry-run] Would start ${targets.length} instance(s):`);
    for (const instance of targets) {
      console.log(`  - ${instance}`);
    }
    return { launched: [], skipped: targets };
  }

  const launched: string[] = [];

  for (const [index, instance] of targets.entries()) {
    if (index > 0 && options.delayMs > 0) {
      await sleep(options.delayMs);
    }

    await launchInstance(options.paths.playerPath, instance);
    launched.push(instance);
    console.log(`Started: ${instance}`);
  }

  console.log(`Done. Launched ${launched.length}/${targets.length} instance(s).`);
  return { launched, skipped: [] };
}
