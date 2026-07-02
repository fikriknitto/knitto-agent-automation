import { devicePool } from "../mobile-automation/libs/driver/device-pool.js";
import {
  listDevices,
  listPackages,
  resolveMainActivity,
} from "../mobile-automation/libs/adb/adb-client.js";

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

export async function getDevicesSnapshot(): Promise<MobileDevicesSnapshot> {
  try {
    await devicePool.refreshFromAdb();
    const devices = devicePool.getSnapshot().map((d) => ({
      udid: d.udid,
      state: d.state,
      jobId: d.jobId,
      model: d.model,
    }));
    return { devices, at: new Date().toISOString(), error: null };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return { devices: [], at: new Date().toISOString(), error: msg };
  }
}

export async function listDevicePackages(
  udid: string,
  query?: string
): Promise<MobilePackageDto[]> {
  const online = await listDevices();
  if (!online.some((d) => d.udid === udid && d.state === "device")) {
    throw new Error(`Device not found or offline: ${udid}`);
  }
  const packages = await listPackages(udid, query);
  return packages.map((pkg) => ({ package: pkg }));
}

export async function resolvePackageActivity(
  udid: string,
  pkg: string
): Promise<{ package: string; activity: string }> {
  const activity = await resolveMainActivity(udid, pkg);
  return { package: pkg, activity };
}
