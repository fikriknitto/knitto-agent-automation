import { adbConnect, formatAdbTarget } from "./adb-connect.js";
import {
  formatAdbDevicesSummary,
  isAdbTargetOnline,
  listAdbDevices,
} from "./adb-devices.js";
import type { ConnectOptions } from "./config.js";
import { assertBlueStacksConfig } from "./config.js";
import { readLaunchState } from "./launch-state.js";
import {
  filterInstances,
  parseInstanceAdbPort,
  parseInstanceNames,
  readConfigContents,
} from "./instances.js";

export type ConnectSummary = {
  connected: Array<{ instance: string; target: string }>;
  skipped: Array<{ instance: string; target: string; reason: string }>;
  failed: Array<{ instance: string; reason: string }>;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function resolveInstanceNames(options: ConnectOptions): string[] {
  const configContents = readConfigContents(options.paths.configPath);
  const discovered = parseInstanceNames(configContents);
  if (!discovered.length) {
    throw new Error(`No BlueStacks instances found in ${options.paths.configPath}`);
  }

  let targets: string[];
  if (options.connectAll) {
    targets = discovered;
  } else {
    const state = readLaunchState();
    if (options.adbHost !== state.adbHost) {
      console.warn(
        `[warn] adb host ${options.adbHost} differs from launch state (${state.adbHost})`
      );
    }
    targets = state.instances;
  }

  return filterInstances(targets, options.only);
}

export async function connectBlueStacksAdb(options: ConnectOptions): Promise<ConnectSummary> {
  assertBlueStacksConfig(options.paths);

  const configContents = readConfigContents(options.paths.configPath);
  const targets = resolveInstanceNames(options);

  if (!targets.length) {
    throw new Error("No instances to connect.");
  }

  let adbBefore = await listAdbDevices();
  console.log("adb devices (before):");
  console.log(formatAdbDevicesSummary(adbBefore));

  if (options.dryRun) {
    console.log(`[dry-run] Would adb connect ${targets.length} instance(s):`);
    for (const instance of targets) {
      const port = parseInstanceAdbPort(configContents, instance);
      if (!port) {
        console.log(`  - ${instance} [warn] No adb_port in config`);
        continue;
      }
      const target = formatAdbTarget(options.adbHost, port);
      const status = isAdbTargetOnline(adbBefore, target) ? "already device" : "would connect";
      console.log(`  - ${instance} → ${target} (${status})`);
    }
    return { connected: [], skipped: [], failed: [] };
  }

  if (options.adbConnectDelayMs > 0) {
    console.log(`Waiting ${options.adbConnectDelayMs}ms for emulators to boot…`);
    await sleep(options.adbConnectDelayMs);
  }

  const connected: ConnectSummary["connected"] = [];
  const skipped: ConnectSummary["skipped"] = [];
  const failed: ConnectSummary["failed"] = [];

  for (const [index, instance] of targets.entries()) {
    if (index > 0 && options.delayMs > 0) {
      await sleep(options.delayMs);
    }

    const port = parseInstanceAdbPort(configContents, instance);
    if (!port) {
      console.warn(`[warn] No adb_port in config for ${instance}, skipping`);
      failed.push({ instance, reason: "missing adb_port in bluestacks.conf" });
      continue;
    }

    const target = formatAdbTarget(options.adbHost, port);
    adbBefore = await listAdbDevices();
    if (isAdbTargetOnline(adbBefore, target)) {
      skipped.push({ instance, target, reason: "already device" });
      console.log(`Already connected: ${instance} → ${target}`);
      continue;
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

  const adbAfter = await listAdbDevices();
  console.log("adb devices (after):");
  console.log(formatAdbDevicesSummary(adbAfter));
  console.log(
    `Done. Connected ${connected.length}, skipped ${skipped.length}, failed ${failed.length}.`
  );

  return { connected, skipped, failed };
}
