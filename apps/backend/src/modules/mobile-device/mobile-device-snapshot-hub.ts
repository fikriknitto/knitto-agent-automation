import mobileConfig from "../../platforms/mobile/config.js";
import type { MobileDevicesSnapshot } from "./mobile-device-service.js";
import { buildDevicesSnapshot } from "./mobile-device-snapshot-build.js";

type SnapshotListener = (snapshot: MobileDevicesSnapshot) => void;

const emptySnapshot = (): MobileDevicesSnapshot => ({
  devices: [],
  at: new Date().toISOString(),
  error: null,
});

class DeviceSnapshotHub {
  private lastSnapshot: MobileDevicesSnapshot = emptySnapshot();
  private listeners = new Set<SnapshotListener>();
  private interval: ReturnType<typeof setInterval> | null = null;
  private refreshPromise: Promise<MobileDevicesSnapshot> | null = null;

  private get pollMs(): number {
    return mobileConfig.devicesPollMs;
  }

  subscribe(listener: SnapshotListener): () => void {
    this.listeners.add(listener);
    listener(this.lastSnapshot);
    this.ensurePolling();
    return () => {
      this.listeners.delete(listener);
      if (this.listeners.size === 0) {
        this.stopPolling();
      }
    };
  }

  getSnapshot(): MobileDevicesSnapshot {
    return this.lastSnapshot;
  }

  async refresh(): Promise<MobileDevicesSnapshot> {
    if (this.refreshPromise) return this.refreshPromise;

    this.refreshPromise = buildDevicesSnapshot()
      .then((snapshot) => {
        this.lastSnapshot = snapshot;
        this.broadcast(snapshot);
        return snapshot;
      })
      .finally(() => {
        this.refreshPromise = null;
      });

    return this.refreshPromise;
  }

  private broadcast(snapshot: MobileDevicesSnapshot): void {
    for (const listener of this.listeners) {
      listener(snapshot);
    }
  }

  private ensurePolling(): void {
    if (this.interval) return;

    void this.refresh();
    this.interval = setInterval(() => {
      void this.refresh();
    }, this.pollMs);
  }

  private stopPolling(): void {
    if (!this.interval) return;
    clearInterval(this.interval);
    this.interval = null;
  }
}

export const deviceSnapshotHub = new DeviceSnapshotHub();
