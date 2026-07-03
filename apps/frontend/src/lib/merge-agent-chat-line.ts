import type { AgentJobMessage } from "@knitto/shared";
import type { ChatLine } from "./types";
import { isTerminalJobStatus } from "./active-jobs";

export function mergeAgentChatLine(msg: AgentJobMessage, prevLine?: ChatLine): ChatLine {
  const isTerminal = isTerminalJobStatus(msg.status);

  const text = isTerminal
    ? (msg.result ?? msg.message ?? prevLine?.text ?? "")
    : (msg.message || prevLine?.text || "Memproses…");

  return {
    id: msg.id,
    role: "agent",
    text,
    status: msg.status,
    progress: msg.progress ?? prevLine?.progress,
    screenshots: msg.screenshots ?? prevLine?.screenshots,
    videoUrl: msg.videoUrl ?? prevLine?.videoUrl,
    toolName: msg.toolName ?? prevLine?.toolName,
  };
}
