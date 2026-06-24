import type { ChatLine } from "../lib/types";
import { MarkdownPreview } from "./markdown-preview";

type JobProgressProps = {
  workerState: "idle" | "busy";
  lastJobMessage: string;
  lastJobProgress: number;
};

export function JobProgress({ workerState, lastJobMessage, lastJobProgress }: JobProgressProps) {
  return (
    <section className="panel compact">
      <h2>Job progress</h2>
      <p className="status-line">
        Worker:{" "}
        <span className={`pill ${workerState === "busy" ? "busy" : ""}`}>
          {workerState === "busy" ? "Busy" : "Idle"}
        </span>
      </p>
      {lastJobMessage && (
        <>
          <p className="job-message">{lastJobMessage}</p>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${lastJobProgress}%` }} />
          </div>
        </>
      )}
    </section>
  );
}

function isAgentResult(status: string | undefined): boolean {
  return status === "completed" || status === "error" || status === "cancelled";
}

export function ChatHistory({ lines }: { lines: ChatLine[] }) {
  return (
    <div className="chat-history">
      {lines.length === 0 && <p className="hint">No messages yet. Send a prompt to start.</p>}
      {lines.map((line) => (
        <div key={`${line.role}-${line.id}`} className={`chat-line ${line.role}`}>
          <span className="chat-role">{line.role}</span>
          <div className="chat-content">
            {line.role === "agent" && isAgentResult(line.status) ? (
              <MarkdownPreview text={line.text} screenshots={line.screenshots} />
            ) : (
              <span className="chat-text">{line.text}</span>
            )}
            {line.status && <span className="chat-status">{line.status}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}
