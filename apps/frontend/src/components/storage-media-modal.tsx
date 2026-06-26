import type { StorageEntry } from "@knitto/shared";
import { XIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { isAcceptedStorageEntry } from "../lib/prompt-attachment";
import {
  modalBackdrop,
  modalHeader,
  modalRoot,
  modalShell,
  modalTitle,
} from "../lib/ui";
import type { FileSelectModifiers } from "./file-manager/file-card";
import { FileManagerPanel } from "./file-manager/file-manager-panel";
import { Button } from "./ui";

type StorageMediaModalProps = {
  open: boolean;
  slotsLeft: number;
  attachedPaths: string[];
  onClose: () => void;
  onApply: (entries: StorageEntry[]) => Promise<void>;
  onEntryDeleted?: (path: string) => void;
  onEntryRenamed?: (oldPath: string, newPath: string) => void;
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
  onEntryDeleted,
  onEntryRenamed,
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
    <div className={modalRoot} role="presentation">
      <div className={modalBackdrop} aria-label="Tutup" onClick={onClose} />
      <div
        className={`${modalShell} h-[90vh]`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="storage-media-modal-title"
      >
        <header className={modalHeader}>
          <h2 id="storage-media-modal-title" className={modalTitle}>
            Storage
          </h2>
          <Button
            variant="ghost"
            size="icon-sm"
            className="border-0 bg-transparent text-xl text-slate-300 hover:bg-slate-600/85 hover:text-slate-50"
            aria-label="Tutup"
            onClick={onClose}
          >
            <XIcon size={16} />
          </Button>
        </header>
        <div className="flex min-h-0 flex-1 flex-col">
          <FileManagerPanel
            enabled={open}
            slotsLeft={slotsLeft}
            attachedPaths={attachedPaths}
            selectedPaths={selectedPaths}
            selectError={selectError}
            onSelectEntry={handleSelectEntry}
            onEntryDeleted={(path) => {
              const prefix = `${path}/`;
              setSelected((prev) =>
                prev.filter((item) => item.path !== path && !item.path.startsWith(prefix))
              );
              setAnchorPath((prev) =>
                prev && (prev === path || prev.startsWith(prefix)) ? null : prev
              );
              onEntryDeleted?.(path);
            }}
            onEntryRenamed={(oldPath, newPath) => {
              setSelected((prev) =>
                prev.map((item) =>
                  item.path === oldPath
                    ? {
                        ...item,
                        path: newPath,
                        id: newPath,
                        name: newPath.split("/").pop() ?? item.name,
                      }
                    : item
                )
              );
              setAnchorPath((prev) => (prev === oldPath ? newPath : prev));
              onEntryRenamed?.(oldPath, newPath);
            }}
          />
        </div>
        <footer className="flex items-center justify-between gap-4 border-t border-white/8 bg-[rgba(9,12,20,0.65)] px-5 py-3.5">
          <span className="text-[0.82rem] text-slate-400">
            {selected.length > 0
              ? `${selected.length} file dipilih`
              : "Belum ada file dipilih"}
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" disabled={applying} onClick={onClose}>
              Batal
            </Button>
            <Button
              size="sm"
              variant="default"
              disabled={!selected.length || applying}
              onClick={() => void handleApply()}
            >
              {applying ? "Menerapkan…" : "Terapkan"}
            </Button>
          </div>
        </footer>
      </div>
    </div>,
    document.body
  );
}
