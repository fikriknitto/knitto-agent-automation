import { EditorContent, useEditor } from "@tiptap/react";
import Placeholder from "@tiptap/extension-placeholder";
import { Markdown } from "@tiptap/markdown";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useMemo, useRef } from "react";
import type { ConnectionState } from "../lib/types";

const MIN_HEIGHT_PX = 96;
const MAX_HEIGHT_PX = 256;

type PromptEditorProps = {
  value: string;
  placeholder?: string;
  connectionState: ConnectionState;
  selectedBridgeId: string;
  workerState: "idle" | "busy";
  onChange: (value: string) => void;
  onSend: () => void;
  onCancel: () => void;
};

function resolveValidationMessage(
  connectionState: ConnectionState,
  selectedBridgeId: string,
  hasPrompt: boolean
): string | null {
  if (connectionState !== "connected") {
    if (connectionState === "connecting") {
      return "Menghubungkan ke WebSocket…";
    }
    if (connectionState === "error") {
      return "Koneksi WebSocket gagal — periksa host/port lalu Connect lagi.";
    }
    return "Connect WebSocket terlebih dahulu di panel Connection.";
  }
  if (!selectedBridgeId) {
    return "Pilih bridge terlebih dahulu.";
  }
  if (!hasPrompt) {
    return "Tulis prompt sebelum mengirim.";
  }
  return null;
}

function autosizeEditor(editorElement: HTMLElement): void {
  editorElement.style.height = "auto";
  const next = Math.min(Math.max(editorElement.scrollHeight, MIN_HEIGHT_PX), MAX_HEIGHT_PX);
  editorElement.style.height = `${next}px`;
  editorElement.style.overflowY = editorElement.scrollHeight > MAX_HEIGHT_PX ? "auto" : "hidden";
}

export function PromptEditor({
  value,
  placeholder = 'e.g. carikan produk "combed 30s" di halaman knitto.co.id',
  connectionState,
  selectedBridgeId,
  workerState,
  onChange,
  onSend,
  onCancel,
}: PromptEditorProps) {
  const skipEmit = useRef(false);

  const hasPrompt = Boolean(value.trim());
  const canSend =
    connectionState === "connected" && Boolean(selectedBridgeId) && hasPrompt;
  const validationMessage = useMemo(
    () =>
      workerState === "busy"
        ? null
        : resolveValidationMessage(connectionState, selectedBridgeId, hasPrompt),
    [connectionState, selectedBridgeId, hasPrompt, workerState]
  );

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        blockquote: false,
        horizontalRule: false,
      }),
      Placeholder.configure({ placeholder }),
      Markdown,
    ],
    content: value,
    contentType: "markdown",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "prompt-editor-content",
      },
    },
    onCreate: ({ editor: ed }) => {
      autosizeEditor(ed.view.dom as HTMLElement);
    },
    onUpdate: ({ editor: ed }) => {
      autosizeEditor(ed.view.dom as HTMLElement);
      if (skipEmit.current) return;
      onChange(ed.getMarkdown());
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = editor.getMarkdown();
    if (value === current) return;

    skipEmit.current = true;
    editor.commands.setContent(value, { contentType: "markdown", emitUpdate: false });
    skipEmit.current = false;
    autosizeEditor(editor.view.dom as HTMLElement);
  }, [editor, value]);

  const isBusy = workerState === "busy";
  const actionTitle = isBusy
    ? "Stop job"
    : validationMessage ?? "Send prompt";

  return (
    <div className="prompt-editor-wrap">
      <div
        className={`prompt-editor-shell${validationMessage ? " is-blocked" : ""}`}
      >
        <div className="prompt-editor-body">
          <EditorContent editor={editor} />
        </div>
        <button
          type="button"
          className={`prompt-editor-action ${isBusy ? "stop" : "send"}`}
          aria-label={actionTitle}
          title={actionTitle}
          onClick={isBusy ? onCancel : onSend}
          disabled={!isBusy && !canSend}
        >
        {isBusy ? (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect x="7" y="7" width="10" height="10" rx="1.5" fill="currentColor" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M12 19V5M12 5l-5 5M12 5l5 5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>
      </div>
      {validationMessage && (
        <p className="prompt-editor-validation" role="status">
          {validationMessage}
        </p>
      )}
    </div>
  );
}
