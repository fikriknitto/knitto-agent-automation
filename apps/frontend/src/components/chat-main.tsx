import { cn } from "@/lib/cn";
import type { AppliedPromptShortcut } from "../lib/prompt-compose";
import type { PromptAttachment } from "../lib/prompt-attachment";
import type { PromptShortcut } from "../lib/prompt-shortcuts";
import type { BridgeSummary, ChatLine, ConnectionState } from "../lib/types";
import { ChatHistory } from "./job-progress";
import { PromptEditor } from "./prompt-editor";
import { PromptShortcutsPanel } from "./prompt-shortcuts-panel";

type ChatMainProps = {
  bridges: BridgeSummary[];
  prompt: string;
  promptBases: AppliedPromptShortcut[];
  promptAttachments: PromptAttachment[];
  workerState: "idle" | "busy";
  connectionState: ConnectionState;
  selectedBridgeId: string;
  selectedModel: string;
  chatLines: ChatLine[];
  onPromptChange: (value: string) => void;
  onAddPromptBase: (shortcut: PromptShortcut, filledText: string) => void;
  onRemovePromptBase: (id: string) => void;
  onApplyMainPrompt: (filledText: string) => void;
  onPromptAttachmentsChange: (attachments: PromptAttachment[]) => void;
  onSelectBridge: (id: string) => void;
  onSelectModel: (id: string) => void;
  onSend: () => void;
  onCancel: () => void;
};

export function ChatMain({
  bridges,
  prompt,
  promptBases,
  promptAttachments,
  workerState,
  connectionState,
  selectedBridgeId,
  selectedModel,
  chatLines,
  onPromptChange,
  onAddPromptBase,
  onRemovePromptBase,
  onApplyMainPrompt,
  onPromptAttachmentsChange,
  onSelectBridge,
  onSelectModel,
  onSend,
  onCancel,
}: ChatMainProps) {
  return (
    <main className="min-h-full pt-12">
      <div className="chat-column mx-auto flex h-screen w-full flex-col px-3 pb-4 sm:px-4">
        <div
          className={cn(
            "composer-shadow fixed w-full max-w-4xl shrink-0 space-y-2 bg-[#0d0d0d] pb-4 pt-2",
            {
              "top-1/2 -translate-y-1/2": chatLines.length === 0,
              "bottom-0": chatLines.length > 0,
            }
          )}
        >
          {chatLines.length > 0 ? <ChatHistory lines={chatLines} /> : <EmptyState />}

          <PromptShortcutsPanel
            disabled={workerState === "busy"}
            onAddPromptBase={onAddPromptBase}
            onApplyMainPrompt={onApplyMainPrompt}
          />
          <PromptEditor
            variant="composer"
            value={prompt}
            promptBases={promptBases}
            attachments={promptAttachments}
            placeholder="Tanyakan automation…"
            connectionState={connectionState}
            selectedBridgeId={selectedBridgeId}
            selectedModel={selectedModel}
            bridges={bridges}
            workerState={workerState}
            onChange={onPromptChange}
            onAttachmentsChange={onPromptAttachmentsChange}
            onRemovePromptBase={onRemovePromptBase}
            onSelectBridge={onSelectBridge}
            onSelectModel={onSelectModel}
            onSend={onSend}
            onCancel={onCancel}
          />
        </div>
      </div>
    </main>
  );
}

function EmptyState() {
  return (
    <div className="mx-auto flex h-full w-full max-w-[800px] flex-col items-center justify-center">
      <div className="text-2xl font-bold">Apa yang ingin Anda otomatisasi?</div>
    </div>
  );
}
