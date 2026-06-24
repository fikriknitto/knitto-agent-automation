export const agentMessages = {
  cancelled: "Dibatalkan",
  cancelledWhileQueued: "Dibatalkan saat antrian",
  waitingInQueue: "Menunggu dalam antrian…",
  completed: "Selesai",
  doneFallback: "Selesai",
  running: "Sedang berjalan…",
  screenshotCaptured: "Screenshot berhasil diambil",
  startingGemini: "Memulai agent Gemini…",
  startingCursor: "Memulai agent Cursor…",
  startingNineRouter: "Memulai agent 9Router…",
  usingTool: (toolName: string) => `Menggunakan ${toolName}…`,
  agentRunFailed: (runId: string) => `Agent gagal (${runId})`,
  rateLimitedRetry: (attempt: number, maxRetries: number, delaySec: number) =>
    `Rate limit — coba lagi ${attempt}/${maxRetries} dalam ${delaySec} detik…`,
} as const;
