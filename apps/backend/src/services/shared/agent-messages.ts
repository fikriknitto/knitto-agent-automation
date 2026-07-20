export const agentMessages = {
  cancelled: "Dibatalkan",
  cancelledWhileQueued: "Dibatalkan saat antrian",
  waitingInQueue: "Menunggu dalam antrian…",
  waitingHostSlot: "Menunggu slot Worker (satu job per host)…",
  completed: "Selesai",
  doneFallback: "Selesai",
  running: "Sedang berjalan…",
  screenshotCaptured: "Screenshot berhasil diambil",
  startingCursor: "Memulai agent Cursor…",
  startingOpenai: "Memulai agent OpenAI-compatible…",
  usingTool: (toolName: string) => `Menggunakan ${toolName}…`,
  agentRunFailed: (runId: string) => `Agent gagal (${runId})`,
  rateLimitedRetry: (attempt: number, maxRetries: number, delaySec: number) =>
    `Rate limit — coba lagi ${attempt}/${maxRetries} dalam ${delaySec} detik…`,
} as const;
