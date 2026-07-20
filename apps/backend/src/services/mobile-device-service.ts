import {
  listPackages,
  resolveMainActivity,
} from "../platforms/mobile/adb/adb-client.js";
import mobileConfig from "../platforms/mobile/config.js";
import { deviceSnapshotHub } from "./mobile-device-snapshot-hub.js";

export type MobileDeviceDto = {
  udid: string;
  state: "idle" | "busy";
  jobId?: string;
  model?: string;
};

export type MobileDevicesSnapshot = {
  devices: MobileDeviceDto[];
  at: string;
  error: string | null;
};

export type MobilePackageDto = {
  package: string;
};

type PackageCacheEntry = {
  packages: string[];
  cachedAt: number;
};

const packageCache = new Map<string, PackageCacheEntry>();
const packageInflight = new Map<string, Promise<string[]>>();

export async function getDevicesSnapshot(): Promise<MobileDevicesSnapshot> {
  return deviceSnapshotHub.refresh();
}

export async function listDevicePackages(
  udid: string,
  query?: string
): Promise<MobilePackageDto[]> {
  const snapshot = deviceSnapshotHub.getSnapshot();
  const known = snapshot.devices.some((d) => d.udid === udid);
  if (!known) {
    await deviceSnapshotHub.refresh();
    const refreshed = deviceSnapshotHub.getSnapshot();
    if (!refreshed.devices.some((d) => d.udid === udid)) {
      throw new Error(`Device not found or offline: ${udid}`);
    }
  }

  const packages = await getCachedPackages(udid);
  const q = query?.trim().toLowerCase();
  const filtered = q
    ? packages.filter((pkg) => pkg.toLowerCase().includes(q))
    : packages;

  return filtered.map((pkg) => ({ package: pkg }));
}

export async function resolvePackageActivity(
  udid: string,
  pkg: string
): Promise<{ package: string; activity: string }> {
  const activity = await resolveMainActivity(udid, pkg);
  return { package: pkg, activity };
}

async function getCachedPackages(udid: string): Promise<string[]> {
  const ttl = mobileConfig.packagesCacheTtlMs;
  const cached = packageCache.get(udid);
  if (cached && Date.now() - cached.cachedAt < ttl) {
    return cached.packages;
  }

  const inflight = packageInflight.get(udid);
  if (inflight) return inflight;

  const promise = listPackages(udid)
    .then((packages) => {
      packageCache.set(udid, { packages, cachedAt: Date.now() });
      return packages;
    })
    .finally(() => {
      packageInflight.delete(udid);
    });

  packageInflight.set(udid, promise);
  return promise;
}
