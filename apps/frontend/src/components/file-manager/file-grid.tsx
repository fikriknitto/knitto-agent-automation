import type { DragEvent, MouseEvent } from "react";
import type { StorageEntry } from "@knitto/shared";
import type { ViewMode } from "../../hooks/use-file-manager";
import { FileCard, type FileSelectModifiers } from "./file-card";

type FileGridProps = {
  entries: StorageEntry[];
  viewMode: ViewMode;
  loading: boolean;
  uploading: boolean;
  selectedPaths: string[];
  attachedPaths: string[];
  dragOver: boolean;
  onOpen: (entry: StorageEntry) => void;
  onSelect: (entry: StorageEntry, modifiers: FileSelectModifiers) => void;
  onDragOver: (event: DragEvent) => void;
  onDragLeave: (event: DragEvent) => void;
  onDrop: (event: DragEvent) => void;
};

export function FileGrid({
  entries,
  viewMode,
  loading,
  uploading,
  selectedPaths,
  attachedPaths,
  dragOver,
  onOpen,
  onSelect,
  onDragOver,
  onDragLeave,
  onDrop,
}: FileGridProps) {
  const empty = !loading && entries.length === 0;
  const selectedSet = new Set(selectedPaths);
  const attachedSet = new Set(attachedPaths);

  const handleMouseDown = (event: MouseEvent) => {
    if (event.shiftKey) event.preventDefault();
  };

  return (
    <div
      className={`file-manager-grid-wrap${dragOver ? " is-drag-over" : ""}${uploading ? " is-uploading" : ""}`}
      onMouseDown={handleMouseDown}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {dragOver && (
        <div className="file-manager-drop-overlay" aria-hidden="true">
          Lepaskan file untuk mengunggah
        </div>
      )}

      {loading && entries.length === 0 ? (
        <p className="file-manager-status">Memuat…</p>
      ) : empty ? (
        <div className="file-manager-empty">
          <p>Folder kosong</p>
          <p className="file-manager-empty-hint">
            Unggah file atau buat folder baru. Anda juga bisa drag & drop ke sini.
          </p>
        </div>
      ) : (
        <div
          className={viewMode === "grid" ? "file-manager-grid" : "file-manager-list"}
          role="list"
        >
          {entries.map((entry) => (
            <FileCard
              key={entry.id}
              entry={entry}
              viewMode={viewMode}
              selected={selectedSet.has(entry.path)}
              alreadyAttached={attachedSet.has(entry.path)}
              onOpen={onOpen}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}
