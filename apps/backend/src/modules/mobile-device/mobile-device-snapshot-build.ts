import { devicePool } from "../../platforms/mobile/driver/device-pool.js";
import type { MobileDevicesSnapshot } from "./mobile-device-service.js";

export async function buildDevicesSnapshot(): Promise<MobileDevicesSnapshot> {
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
