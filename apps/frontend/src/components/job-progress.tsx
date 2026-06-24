import { cn } from "../lib/cn";
import type { ChatLine } from "../lib/types";
import { hint, statusLine } from "../lib/ui";
import { MarkdownPreview } from "./markdown-preview";
import { ChatAttachments } from "./prompt-attachment-chip";
import { Badge, Card, CardTitle } from "./ui";

type JobProgressProps = {
  workerState: "idle" | "busy";
  lastJobMessage: string;
  lastJobProgress: number;
};

export function JobProgress({ workerState, lastJobMessage, lastJobProgress }: JobProgressProps) {
  return (
    <Card>
      <CardTitle compact>Job progress</CardTitle>
      <p className={statusLine}>
        Worker:{" "}
        <Badge variant={workerState === "busy" ? "warning" : "default"}>
          {workerState === "busy" ? "Busy" : "Idle"}
        </Badge>
      </p>
      {lastJobMessage && (
        <>
          <p className="my-2 text-sm text-slate-300">{lastJobMessage}</p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/6">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400 transition-[width] duration-300 ease-out"
              style={{ width: `${lastJobProgress}%` }}
            />
          </div>
        </>
      )}
    </Card>
  );
}

function isAgentResult(status: string | undefined): boolean {
  return status === "completed" || status === "error" || status === "cancelled";
}

const chatLineBase =
  "grid grid-cols-[4.5rem_1fr] gap-3 rounded-lg border p-3 text-[0.95rem]";

const chatRoleBase = "pt-0.5 text-xs font-bold uppercase tracking-wider";

export function ChatHistory({ lines }: { lines: ChatLine[] }) {
  return (
    <div className="my-4 flex max-h-[55vh] flex-1 flex-col gap-4 overflow-y-auto rounded-[10px] border border-white/4 bg-[rgba(10,11,16,0.8)] p-4 shadow-[inset_0_2px_8px_rgba(0,0,0,0.5)]">
      {lines.length === 0 && <p className={hint}>No messages yet. Send a prompt to start.</p>}
      {lines.map((line) => (
        <div
          key={`${line.role}-${line.id}`}
          className={cn(
            chatLineBase,
            line.role === "user" && "border-blue-500/10 bg-blue-500/5",
            line.role === "agent" && "border-emerald-500/8 bg-emerald-500/4"
          )}
        >
          <span
            className={cn(
              chatRoleBase,
              line.role === "user" && "text-blue-400",
              line.role === "agent" && "text-emerald-400"
            )}
          >
            {line.role}
          </span>
          <div className="flex min-w-0 flex-col gap-2">
            {line.role === "agent" && isAgentResult(line.status) ? (
              <MarkdownPreview text={line.text} screenshots={line.screenshots} />
            ) : (
              <>
                {line.text.trim() && (
                  <span className="wrap-break-word leading-normal">{line.text}</span>
                )}
                {line.role === "user" && line.attachments?.length ? (
                  <ChatAttachments attachments={line.attachments} />
                ) : null}
              </>
            )}
            {line.status && <span className="text-xs text-slate-500">{line.status}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}
