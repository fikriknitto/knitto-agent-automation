import type { ConnectOptions } from "./config.js";
import { readLaunchState } from "./launch-state.js";
import { filterInstances, parseInstanceNames, readConfigContents } from "./instances.js";

export function resolveAdbInstanceTargets(options: ConnectOptions): string[] {
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
