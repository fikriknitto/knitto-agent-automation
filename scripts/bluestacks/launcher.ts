import { spawn } from "node:child_process";
import { adbConnect, formatAdbTarget } from "./adb-connect.js";
import type { LaunchOptions } from "./config.js";
import { assertBlueStacksPaths } from "./config.js";
import {
  filterInstances,
  limitInstances,
  parseInstanceAdbPort,
  parseInstanceNames,
  readConfigContents,
} from "./instances.js";

export type LaunchSummary = {
  launched: string[];
  connected: Array<{ instance: string; target: string }>;
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
      if (!options.skipAdb) {
        const port = parseInstanceAdbPort(configContents, instance);
        if (port) {
          console.log(`    Would adb connect ${formatAdbTarget(options.adbHost, port)}`);
        } else {
          console.log(`    [warn] No adb_port found for ${instance}`);
        }
      }
    }
    return { launched: [], connected: [], skipped: targets, failed: [] };
  }

  const launched: string[] = [];
  const connected: LaunchSummary["connected"] = [];
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
      continue;
    }

    if (options.skipAdb) continue;

    const port = parseInstanceAdbPort(configContents, instance);
    if (!port) {
      console.warn(`[warn] No adb_port in config for ${instance}, skipping adb connect`);
      continue;
    }

    const target = formatAdbTarget(options.adbHost, port);
    if (options.adbConnectDelayMs > 0) {
      await sleep(options.adbConnectDelayMs);
    }

    try {
      const output = await adbConnect(options.adbHost, port);
      connected.push({ instance, target });
      console.log(`ADB connected: ${instance} → ${target}${output ? ` (${output})` : ""}`);
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      failed.push({ instance, reason });
      console.error(`ADB connect failed for ${instance}: ${reason}`);
    }
  }

  console.log(
    `Done. Launched ${launched.length}/${targets.length}, ADB connected ${connected.length}.`
  );
  if (failed.length) {
    console.log(`Failures: ${failed.length}`);
  }

  return { launched, connected, skipped: [], failed };
}
