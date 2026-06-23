import type { AgentJobMessage, BridgeJob, UserPromptMessage } from "./types.js";

export type JobEmitter = (msg: AgentJobMessage) => void;

export interface BridgeJobHandle {
  promise: Promise<void>;
  cancel: () => Promise<void>;
}

export type JobRunner = (job: BridgeJob, emit: JobEmitter) => BridgeJobHandle;

export class JobQueue {
  private readonly pending = new Map<string, BridgeJob[]>();
  private readonly runningCount = new Map<string, number>();
  private readonly activeCancels = new Map<string, () => Promise<void>>();

  constructor(
    private readonly emit: JobEmitter,
    private readonly maxConcurrent: number,
    private readonly startJob: JobRunner
  ) {}

  enqueueFromMessage(msg: UserPromptMessage): void {
    this.enqueue({
      id: msg.id,
      channel: msg.channel,
      text: msg.text,
      strategy: msg.strategy,
      model: msg.model,
      attachments: msg.attachments,
    });
  }

  enqueue(job: BridgeJob): void {
    this.emit({
      type: "agent_job",
      id: job.id,
      channel: job.channel,
      status: "queued",
      message: "Waiting in queue…",
      progress: 0,
    });

    const list = this.pending.get(job.channel) ?? [];
    list.push(job);
    this.pending.set(job.channel, list);
    void this.pump(job.channel);
  }

  async cancel(jobId: string, channel: string): Promise<boolean> {
    const list = this.pending.get(channel);
    if (list) {
      const idx = list.findIndex((j) => j.id === jobId);
      if (idx >= 0) {
        list.splice(idx, 1);
        this.emit({
          type: "agent_job",
          id: jobId,
          channel,
          status: "cancelled",
          message: "Cancelled while queued",
        });
        return true;
      }
    }

    const cancelFn = this.activeCancels.get(jobId);
    if (cancelFn) {
      await cancelFn();
      this.activeCancels.delete(jobId);
      return true;
    }
    return false;
  }

  private getRunning(channel: string): number {
    return this.runningCount.get(channel) ?? 0;
  }

  private async pump(channel: string): Promise<void> {
    while (this.getRunning(channel) < this.maxConcurrent) {
      const list = this.pending.get(channel);
      if (!list?.length) return;

      const job = list.shift()!;
      if (!list.length) this.pending.delete(channel);

      this.runningCount.set(channel, this.getRunning(channel) + 1);

      const handle = this.startJob(job, this.emit);
      this.activeCancels.set(job.id, handle.cancel);

      try {
        await handle.promise;
      } finally {
        this.activeCancels.delete(job.id);
        this.runningCount.set(channel, Math.max(0, this.getRunning(channel) - 1));
        void this.pump(channel);
      }
    }
  }
}
