import { adbDisconnect, formatAdbTarget } from "./adb-connect.js";
import {
  formatAdbDevicesSummary,
  isAdbTargetOnline,
  listAdbDevices,
} from "./adb-devices.js";
import type { ConnectOptions } from "./config.js";
import { assertBlueStacksConfig } from "./config.js";
import { parseInstanceAdbPort, readConfigContents } from "./instances.js";
import { resolveAdbInstanceTargets } from "./resolve-targets.js";

export type DisconnectSummary = {
  disconnected: Array<{ instance: string; target: string }>;
  skipped: Array<{ instance: string; target: string; reason: string }>;
  failed: Array<{ instance: string; reason: string }>;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function disconnectBlueStacksAdb(
  options: ConnectOptions
): Promise<DisconnectSummary> {
  assertBlueStacksConfig(options.paths);

  const configContents = readConfigContents(options.paths.configPath);
  const targets = resolveAdbInstanceTargets(options);

  if (!targets.length) {
    throw new Error("No instances to disconnect.");
  }

  let adbBefore = await listAdbDevices();
  console.log("adb devices (before):");
  console.log(formatAdbDevicesSummary(adbBefore));

  if (options.dryRun) {
    console.log(`[dry-run] Would adb disconnect ${targets.length} instance(s):`);
    for (const instance of targets) {
      const port = parseInstanceAdbPort(configContents, instance);
      if (!port) {
        console.log(`  - ${instance} [warn] No adb_port in config`);
        continue;
      }
      const target = formatAdbTarget(options.adbHost, port);
      const status = isAdbTargetOnline(adbBefore, target) ? "would disconnect" : "not connected";
      console.log(`  - ${instance} → ${target} (${status})`);
    }
    return { disconnected: [], skipped: [], failed: [] };
  }

  const disconnected: DisconnectSummary["disconnected"] = [];
  const skipped: DisconnectSummary["skipped"] = [];
  const failed: DisconnectSummary["failed"] = [];

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
    if (!isAdbTargetOnline(adbBefore, target)) {
      skipped.push({ instance, target, reason: "not connected" });
      console.log(`Not connected: ${instance} → ${target}`);
      continue;
    }

    try {
      const output = await adbDisconnect(options.adbHost, port);
      disconnected.push({ instance, target });
      console.log(
        `ADB disconnected: ${instance} → ${target}${output ? ` (${output})` : ""}`
      );
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      failed.push({ instance, reason });
      console.error(`ADB disconnect failed for ${instance}: ${reason}`);
    }
  }

  const adbAfter = await listAdbDevices();
  console.log("adb devices (after):");
  console.log(formatAdbDevicesSummary(adbAfter));
  console.log(
    `Done. Disconnected ${disconnected.length}, skipped ${skipped.length}, failed ${failed.length}.`
  );

  return { disconnected, skipped, failed };
}
