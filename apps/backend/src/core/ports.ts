/**
 * Kontrak yang diimplement tiap platform automation (browser/mobile).
 *
 * Tujuan akhir: core/ hanya bergantung pada interface di file ini, bukan pada
 * modul konkret di platforms/. Edge langsung yang tersisa terdokumentasi di
 * README.md (TODO(ports)) dan seharusnya menyusut, bukan bertambah.
 */
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";

export type AutomationPlatformId = "browser" | "mobile";

/** Lifecycle sesi driver (Puppeteer page / Appium session). */
export interface PlatformSessionPort {
  /** Tutup sesi & lepaskan resource; best-effort, tidak boleh melempar. */
  closeSession(): Promise<void>;
}

/** Rekaman video evidence per test-case segment. */
export interface PlatformRecordingPort {
  startRecording(jobId: string): Promise<void>;
  stopRecording(jobId: string): Promise<string | null>;
}

/** Akses MCP tools platform dari dalam proses backend. */
export interface PlatformMcpPort {
  createInProcessClient(): Client;
}

export interface AutomationPlatform {
  id: AutomationPlatformId;
  session: PlatformSessionPort;
  recording: PlatformRecordingPort;
  mcp: PlatformMcpPort;
}
