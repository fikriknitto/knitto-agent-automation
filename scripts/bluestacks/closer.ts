import type { CloseOptions } from "./config.js";
import { assertBlueStacksPaths } from "./config.js";
import { clearLaunchState, readLaunchState } from "./launch-state.js";
import {
  filterInstances,
  parseInstanceNames,
  readConfigContents,
} from "./instances.js";
import {
  isBlueStacksInstanceRunning,
  killAllHdPlayerProcesses,
} from "./instance-process.js";

export type CloseSummary = {
  closed: string[];
  skipped: Array<{ instance: string; reason: string }>;
  failed: Array<{ instance: string; reason: string }>;
};

async function resolveCloseTargets(options: CloseOptions): Promise<string[]> {
  const configContents = readConfigContents(options.paths.configPath);
  const discovered = parseInstanceNames(configContents);
  if (!discovered.length) {
    throw new Error(`No BlueStacks instances found in ${options.paths.configPath}`);
  }

  let targets: string[];
  if (options.closeAll) {
    const running: string[] = [];
    for (const instance of discovered) {
      if (await isBlueStacksInstanceRunning(instance)) {
        running.push(instance);
      }
    }
    targets = running;
  } else {
    targets = readLaunchState().instances;
  }

  return filterInstances(targets, options.only);
}

export async function closeBlueStacksInstances(options: CloseOptions): Promise<CloseSummary> {
  assertBlueStacksPaths(options.paths);

  const targets = await resolveCloseTargets(options);
  if (!targets.length) {
    throw new Error("No instances to close.");
  }

  if (options.dryRun) {
    console.log("[dry-run] Would run: taskkill /F /IM HD-Player.exe");
    for (const instance of targets) {
      const running = await isBlueStacksInstanceRunning(instance);
      console.log(`  - ${instance} (${running ? "running" : "not running"})`);
    }
    return { closed: [], skipped: [], failed: [] };
  }

  const closed: string[] = [];
  const skipped: CloseSummary["skipped"] = [];

  for (const instance of targets) {
    const running = await isBlueStacksInstanceRunning(instance);
    if (running) {
      closed.push(instance);
    } else {
      skipped.push({ instance, reason: "not running" });
      console.log(`Skipped (not running): ${instance}`);
    }
  }

  console.log("Stopping BlueStacks: taskkill /F /IM HD-Player.exe");
  const killResult = await killAllHdPlayerProcesses();
  if (killResult === "killed") {
    console.log("HD-Player.exe terminated.");
  } else {
    console.log("HD-Player.exe was not running.");
  }

  if (!options.closeAll) {
    clearLaunchState();
    console.log("Cleared launch state → .bluestacks/last-launched.json");
  }

  console.log(`Done. Closed ${closed.length}, skipped ${skipped.length}, failed 0.`);
  return { closed, skipped, failed: [] };
}
