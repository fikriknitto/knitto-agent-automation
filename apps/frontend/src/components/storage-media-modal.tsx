import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { StorageEntry } from "@knitto/shared";
import type { FileSelectModifiers } from "./file-manager/file-card";
import { FileManagerPanel } from "./file-manager/file-manager-panel";
import { isAcceptedStorageEntry } from "../lib/prompt-attachment";

type StorageMediaModalProps = {
  open: boolean;
  slotsLeft: number;
  attachedPaths: string[];
  onClose: () => void;
  onApply: (entries: StorageEntry[]) => Promise<void>;
};

function isMultiSelectModifier(modifiers: FileSelectModifiers): boolean {
  return modifiers.ctrlKey || modifiers.metaKey;
}

function selectableFiles(
  visibleEntries: StorageEntry[],
  attachedPaths: string[]
): StorageEntry[] {
  const attached = new Set(attachedPaths);
  return visibleEntries.filter(
    (entry) =>
      entry.type === "file" &&
      isAcceptedStorageEntry(entry.name, entry.mimeType) &&
      !attached.has(entry.path)
  );
}

export function StorageMediaModal({
  open,
  slotsLeft,
  attachedPaths,
  onClose,
  onApply,
}: StorageMediaModalProps) {
  const [selected, setSelected] = useState<StorageEntry[]>([]);
  const [anchorPath, setAnchorPath] = useState<string | null>(null);
  const [selectError, setSelectError] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    if (!open) {
      setSelected([]);
      setAnchorPath(null);
      setSelectError(null);
      setApplying(false);
    }
  }, [open]);

  const capSelection = useCallback(
    (entries: StorageEntry[]): StorageEntry[] => {
      if (entries.length > slotsLeft) {
        setSelectError(`Maksimal ${slotsLeft} file dapat dipilih.`);
        return entries.slice(0, slotsLeft);
      }
      setSelectError(null);
      return entries;
    },
    [slotsLeft]
  );

  const handleSelectEntry = useCallback(
    (
      entry: StorageEntry,
      visibleEntries: StorageEntry[],
      modifiers: FileSelectModifiers
    ) => {
      if (entry.type !== "file") return;
      if (attachedPaths.includes(entry.path)) {
        setSelectError("File ini sudah dilampirkan.");
        return;
      }
      if (!isAcceptedStorageEntry(entry.name, entry.mimeType)) return;

      const selectable = selectableFiles(visibleEntries, attachedPaths);

      if (modifiers.shiftKey) {
        const anchor = anchorPath ?? entry.path;
        const paths = selectable.map((item) => item.path);
        const anchorIdx = paths.indexOf(anchor);
        const currentIdx = paths.indexOf(entry.path);

        if (anchorIdx >= 0 && currentIdx >= 0) {
          const [start, end] =
            anchorIdx <= currentIdx ? [anchorIdx, currentIdx] : [currentIdx, anchorIdx];
          setSelected(capSelection(selectable.slice(start, end + 1)));
          setAnchorPath(anchor);
          return;
        }
      }

      if (isMultiSelectModifier(modifiers)) {
        setSelected((prev) => {
          const exists = prev.some((item) => item.path === entry.path);
          if (exists) {
            setSelectError(null);
            return prev.filter((item) => item.path !== entry.path);
          }
          if (prev.length >= slotsLeft) {
            setSelectError(`Maksimal ${slotsLeft} file dapat dipilih.`);
            return prev;
          }
          setSelectError(null);
          return [...prev, entry];
        });
        setAnchorPath(entry.path);
        return;
      }

      setSelected(capSelection([entry]));
      setAnchorPath(entry.path);
    },
    [anchorPath, attachedPaths, capSelection, slotsLeft]
  );

  const handleApply = async () => {
    if (!selected.length || applying) return;
    setApplying(true);
    setSelectError(null);
    try {
      await onApply(selected);
      setSelected([]);
      setAnchorPath(null);
      onClose();
    } catch (err) {
      setSelectError(err instanceof Error ? err.message : "Gagal menerapkan lampiran");
    } finally {
      setApplying(false);
    }
  };

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  const selectedPaths = selected.map((entry) => entry.path);

  return createPortal(
    <div className="storage-media-modal-root" role="presentation">
      <div
        className="storage-media-modal-backdrop"
        aria-label="Tutup"
        onClick={onClose}
      />
      <div
        className="storage-media-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="storage-media-modal-title"
      >
        <header className="storage-media-modal-header">
          <h2 id="storage-media-modal-title">My Files</h2>
          <button
            type="button"
            className="storage-media-modal-close"
            aria-label="Tutup"
            onClick={onClose}
          >
            ×
          </button>
        </header>
        <div className="storage-media-modal-body">
          <FileManagerPanel
            enabled={open}
            slotsLeft={slotsLeft}
            attachedPaths={attachedPaths}
            selectedPaths={selectedPaths}
            selectError={selectError}
            onSelectEntry={handleSelectEntry}
          />
        </div>
        <footer className="storage-media-modal-footer">
          <span className="storage-media-modal-footer-count">
            {selected.length > 0
              ? `${selected.length} file dipilih`
              : "Belum ada file dipilih"}
          </span>
          <div className="storage-media-modal-footer-actions">
            <button
              type="button"
              className="file-manager-btn"
              disabled={applying}
              onClick={onClose}
            >
              Batal
            </button>
            <button
              type="button"
              className="file-manager-btn file-manager-btn-primary"
              disabled={!selected.length || applying}
              onClick={() => void handleApply()}
            >
              {applying ? "Menerapkan…" : "Terapkan"}
            </button>
          </div>
        </footer>
      </div>
    </div>,
    document.body
  );
}
