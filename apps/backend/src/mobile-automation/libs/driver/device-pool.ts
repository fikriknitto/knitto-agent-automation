import { ToolError } from "../../../automation/core/index.js";
import { listDevices, pingDevice } from "../adb/adb-client.js";
import config from "../config.js";

export type DeviceState = "idle" | "busy";

export type PooledDevice = {
  udid: string;
  state: DeviceState;
  jobId?: string;
  acquiredAt?: number;
  model?: string;
};

type Waiter = {
  resolve: (udid: string) => void;
  reject: (error: Error) => void;
  preferredUdid?: string;
};

class DevicePool {
  private pool = new Map<string, PooledDevice>();
  private waiters: Waiter[] = [];
  private roundRobinIndex = 0;

  async refreshFromAdb(): Promise<void> {
    const online = await listDevices();
    const allowlist = config.deviceUdidsAllowlist;
    const filtered = online.filter((d) => {
      if (d.state !== "device") return false;
      if (allowlist?.length && !allowlist.includes(d.udid)) return false;
      return true;
    });

    for (const device of filtered) {
      const existing = this.pool.get(device.udid);
      if (existing) {
        existing.model = device.model;
      } else {
        this.pool.set(device.udid, {
          udid: device.udid,
          state: "idle",
          model: device.model,
        });
      }
    }

    for (const udid of [...this.pool.keys()]) {
      if (!filtered.some((d) => d.udid === udid)) {
        const entry = this.pool.get(udid);
        if (entry?.state === "busy") continue;
        this.pool.delete(udid);
      }
    }
  }

  getSnapshot(): PooledDevice[] {
    return [...this.pool.values()].sort((a, b) => a.udid.localeCompare(b.udid));
  }

  private pickIdle(preferredUdid?: string): string | undefined {
    const idle = this.getSnapshot().filter((d) => d.state === "idle");
    if (!idle.length) return undefined;

    if (preferredUdid) {
      const match = idle.find((d) => d.udid === preferredUdid);
      if (match) return match.udid;
      return undefined;
    }

    if (!config.devicePoolEnabled) {
      return idle[0]?.udid;
    }

    const idx = this.roundRobinIndex % idle.length;
    this.roundRobinIndex = (this.roundRobinIndex + 1) % idle.length;
    return idle[idx]?.udid;
  }

  private markBusy(udid: string, jobId: string): void {
    const entry = this.pool.get(udid);
    if (!entry) {
      this.pool.set(udid, {
        udid,
        state: "busy",
        jobId,
        acquiredAt: Date.now(),
      });
      return;
    }
    entry.state = "busy";
    entry.jobId = jobId;
    entry.acquiredAt = Date.now();
  }

  private flushWaiters(): void {
    const remaining: Waiter[] = [];
    for (const waiter of this.waiters) {
      const udid = this.pickIdle(waiter.preferredUdid);
      if (udid) {
        this.markBusy(udid, "pending");
        waiter.resolve(udid);
      } else {
        remaining.push(waiter);
      }
    }
    this.waiters = remaining;
  }

  async acquire(jobId: string, preferredUdid?: string): Promise<string> {
    const pinned = preferredUdid?.trim() || config.pinnedUdid;
    const deadline = Date.now() + config.deviceAcquireTimeoutMs;

    while (Date.now() < deadline) {
      await this.refreshFromAdb();
      const online = this.getSnapshot();

      if (!online.length) {
        throw new ToolError(
          "Tidak ada device Android terhubung. Jalankan emulator atau hubungkan device via USB."
        );
      }

      if (pinned) {
        const device = online.find((d) => d.udid === pinned);
        if (!device) {
          throw new ToolError(`Device tidak ditemukan: ${pinned}`);
        }
        const entry = this.pool.get(pinned);
        if (entry?.jobId === jobId) {
          // Re-entrant acquire by the job that already owns this device — no need to re-probe.
          this.markBusy(pinned, jobId);
          return pinned;
        }
        if (device.state === "idle") {
          // Reserve synchronously (no await before markBusy) so a concurrent
          // acquire() for another job can't also see this device as idle and
          // grab it — the ping below only validates, it must not race the pick.
          this.markBusy(pinned, jobId);
          if (await pingDevice(pinned)) {
            return pinned;
          }
          this.release(jobId);
          throw new ToolError(
            `Device ${pinned} terlihat "device" di adb tapi tidak merespons shell. Coba: adb kill-server && adb start-server, atau restart BlueStacks/emulator.`
          );
        }
      } else {
        const udid = this.pickIdle();
        if (udid) {
          this.markBusy(udid, jobId);
          if (await pingDevice(udid)) {
            return udid;
          }
          // Unresponsive device — release and let the next loop iteration try again.
          this.release(jobId);
        }
      }

      await new Promise((r) => setTimeout(r, 500));
    }

    await this.refreshFromAdb();
    const snapshot = this.getSnapshot();
    const busyCount = snapshot.filter((d) => d.state === "busy").length;
    const total = snapshot.length;

    if (pinned) {
      throw new ToolError(`Device ${pinned} sedang dipakai job lain. Coba lagi nanti.`);
    }
    throw new ToolError(`Semua device busy (${busyCount}/${total}). Coba lagi nanti.`);
  }

  release(jobId: string): void {
    for (const entry of this.pool.values()) {
      if (entry.jobId === jobId) {
        entry.state = "idle";
        entry.jobId = undefined;
        entry.acquiredAt = undefined;
      }
    }
    this.flushWaiters();
  }
}

export const devicePool = new DevicePool();
