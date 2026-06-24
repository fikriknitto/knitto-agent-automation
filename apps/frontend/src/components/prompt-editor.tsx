import type { StorageEntry } from "@knitto/shared";
import Placeholder from "@tiptap/extension-placeholder";
import { Markdown } from "@tiptap/markdown";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ACCEPTED_FILE_INPUT,
  attachmentExtension,
  filesToPromptAttachments,
  isAcceptedAttachment,
  isPasteableImage,
  promptAttachmentImageSrc,
  promptAttachmentTitle,
  storageEntryToPromptAttachment,
  type PromptAttachment,
} from "../lib/prompt-attachment";
import type { ConnectionState } from "../lib/types";
import { StorageMediaModal } from "./storage-media-modal";

const MIN_HEIGHT_PX = 96;
const MAX_HEIGHT_PX = 256;
const MAX_ATTACHMENTS = 4;

type PromptEditorProps = {
  value: string;
  attachments: PromptAttachment[];
  placeholder?: string;
  connectionState: ConnectionState;
  selectedBridgeId: string;
  workerState: "idle" | "busy";
  onChange: (value: string) => void;
  onAttachmentsChange: (attachments: PromptAttachment[]) => void;
  onSend: () => void;
  onCancel: () => void;
};

function resolveValidationMessage(
  connectionState: ConnectionState,
  selectedBridgeId: string,
  hasContent: boolean
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
  if (!hasContent) {
    return "Tulis prompt atau lampirkan file sebelum mengirim.";
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
  attachments,
  placeholder = 'e.g. carikan produk "combed 30s" di halaman knitto.co.id',
  connectionState,
  selectedBridgeId,
  workerState,
  onChange,
  onAttachmentsChange,
  onSend,
  onCancel,
}: PromptEditorProps) {
  const skipEmit = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [attachError, setAttachError] = useState<string | null>(null);
  const [storageModalOpen, setStorageModalOpen] = useState(false);

  const hasText = Boolean(value.trim());
  const hasContent = hasText || attachments.length > 0;
  const canSend =
    connectionState === "connected" && Boolean(selectedBridgeId) && hasContent;
  const validationMessage = useMemo(
    () =>
      workerState === "busy"
        ? null
        : resolveValidationMessage(connectionState, selectedBridgeId, hasContent),
    [connectionState, selectedBridgeId, hasContent, workerState]
  );

  const appendAttachments = useCallback(
    async (files: FileList | File[]) => {
      const incoming = Array.from(files);
      if (!incoming.length) return;

      const slotsLeft = MAX_ATTACHMENTS - attachments.length;
      if (slotsLeft <= 0) {
        setAttachError(`Maksimal ${MAX_ATTACHMENTS} lampiran per prompt.`);
        return;
      }

      try {
        const accepted = incoming.filter(isAcceptedAttachment).slice(0, slotsLeft);
        if (!accepted.length) {
          setAttachError(
            "Tipe file tidak didukung. File executable atau tanpa ekstensi tidak diizinkan."
          );
          return;
        }
        const next = await filesToPromptAttachments(accepted);
        onAttachmentsChange([...attachments, ...next]);
        setAttachError(null);
      } catch (error) {
        setAttachError(error instanceof Error ? error.message : String(error));
      }
    },
    [attachments, onAttachmentsChange]
  );

  const attachedStoragePaths = useMemo(
    () => attachments.map((a) => a.storagePath),
    [attachments]
  );

  const handleStorageApply = useCallback(
    async (entries: StorageEntry[]) => {
      if (!entries.length) return;

      const slotsLeft = MAX_ATTACHMENTS - attachments.length;
      if (slotsLeft <= 0) {
        setAttachError(`Maksimal ${MAX_ATTACHMENTS} lampiran per prompt.`);
        throw new Error("Slot lampiran penuh");
      }

      const unique = entries.filter(
        (entry, index, list) =>
          list.findIndex((item) => item.path === entry.path) === index &&
          !attachments.some((a) => a.storagePath === entry.path)
      );

      const toAdd = unique.slice(0, slotsLeft);
      if (!toAdd.length) {
        setAttachError("File yang dipilih sudah dilampirkan.");
        throw new Error("Sudah dilampirkan");
      }

      const newAttachments = toAdd.map((entry) => storageEntryToPromptAttachment(entry));

      onAttachmentsChange([...attachments, ...newAttachments]);
      setAttachError(null);
    },
    [attachments, onAttachmentsChange]
  );

  const handlePaste = useCallback(
    async (event: React.ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items?.length) return;

      const imageFiles: File[] = [];
      for (const item of items) {
        if (item.kind !== "file") continue;
        const file = item.getAsFile();
        if (file && isPasteableImage(file)) imageFiles.push(file);
      }

      if (!imageFiles.length) return;
      event.preventDefault();
      await appendAttachments(imageFiles);
    },
    [appendAttachments]
  );

  const handleDrop = useCallback(
    async (event: React.DragEvent) => {
      event.preventDefault();
      setDragOver(false);
      if (workerState === "busy") return;
      await appendAttachments(event.dataTransfer.files);
    },
    [appendAttachments, workerState]
  );

  const removeAttachment = (index: number) => {
    onAttachmentsChange(attachments.filter((_, i) => i !== index));
    setAttachError(null);
  };

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
    editable: workerState !== "busy",
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
    editor.setEditable(workerState !== "busy");
  }, [editor, workerState]);

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
  const actionTitle = isBusy ? "Stop job" : validationMessage ?? "Send prompt";
  const canAttach = !isBusy && attachments.length < MAX_ATTACHMENTS;

  return (
    <div className="prompt-editor-wrap">
      {attachments.length > 0 && (
        <div className="prompt-attachments" aria-label="Lampiran">
          {attachments.map((attachment, index) => (
            <figure
              key={`${attachment.storagePath}-${index}`}
              className={[
                "prompt-attachment",
                attachment.kind === "file" ? "prompt-attachment-file" : "",
                "prompt-attachment-from-storage",
              ]
                .filter(Boolean)
                .join(" ")}
              title={promptAttachmentTitle(attachment)}
            >
              <span className="prompt-attachment-index" aria-hidden="true">
                {index + 1}
              </span>
              <span className="prompt-attachment-source" aria-hidden="true">
                ☁
              </span>
              {attachment.kind === "image" ? (
                <img
                  src={promptAttachmentImageSrc(attachment)}
                  alt={attachment.name}
                />
              ) : (
                <div className="prompt-attachment-file-body">
                  <span className="prompt-attachment-ext">{attachmentExtension(attachment.name)}</span>
                  <span className="prompt-attachment-name">
                    {attachment.name}
                  </span>
                  <span className="prompt-attachment-path">{attachment.storagePath}</span>
                </div>
              )}
              <button
                type="button"
                className="prompt-attachment-remove"
                aria-label="Hapus lampiran"
                title="Hapus lampiran"
                disabled={isBusy}
                onClick={() => removeAttachment(index)}
              >
                ×
              </button>
            </figure>
          ))}
        </div>
      )}

      <div
        className={`prompt-editor-shell${validationMessage ? " is-blocked" : ""}${dragOver ? " is-drag-over" : ""}`}
        onDragEnter={(event) => {
          event.preventDefault();
          if (!isBusy) setDragOver(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          if (!isBusy) setDragOver(true);
        }}
        onDragLeave={(event) => {
          if (event.currentTarget.contains(event.relatedTarget as Node)) return;
          setDragOver(false);
        }}
        onDrop={handleDrop}
        onPaste={handlePaste}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_FILE_INPUT}
          multiple
          className="prompt-file-input"
          onChange={async (event) => {
            const files = event.target.files;
            if (files?.length) await appendAttachments(files);
            event.target.value = "";
          }}
        />

        <button
          type="button"
          className="prompt-attach-btn"
          aria-label="Lampirkan media"
          title="Lampirkan media"
          disabled={!canAttach}
          onClick={() => setStorageModalOpen(true)}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect
              x="3"
              y="3"
              width="18"
              height="18"
              rx="2"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
            <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
            <path
              d="M21 15l-5-5L5 21"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

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

        {dragOver && !isBusy && (
          <div className="prompt-drop-overlay">Lepaskan file di sini</div>
        )}
      </div>

      {attachError && (
        <p className="prompt-editor-attach-error" role="alert">
          {attachError}
        </p>
      )}
      {validationMessage && (
        <p className="prompt-editor-validation" role="status">
          {validationMessage}
        </p>
      )}

      <StorageMediaModal
        open={storageModalOpen}
        slotsLeft={MAX_ATTACHMENTS - attachments.length}
        attachedPaths={attachedStoragePaths}
        onClose={() => setStorageModalOpen(false)}
        onApply={handleStorageApply}
      />
    </div>
  );
}
