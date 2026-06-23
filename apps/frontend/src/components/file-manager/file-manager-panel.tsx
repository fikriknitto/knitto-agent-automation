import { useCallback, useState, type DragEvent } from "react";
import type { StorageEntry } from "@knitto/shared";
import { useFileManager } from "../../hooks/use-file-manager";
import { formatBytes, formatItemCount } from "../../lib/file-utils";
import { BreadcrumbNav } from "./breadcrumb-nav";
import { FileGrid } from "./file-grid";
import type { FileSelectModifiers } from "./file-card";
import { FileToolbar } from "./file-toolbar";

type FileManagerPanelProps = {
  enabled: boolean;
  slotsLeft: number;
  attachedPaths: string[];
  selectedPaths: string[];
  selectError: string | null;
  onSelectEntry: (
    entry: StorageEntry,
    visibleEntries: StorageEntry[],
    modifiers: FileSelectModifiers
  ) => void;
};

export function FileManagerPanel({
  enabled,
  slotsLeft,
  attachedPaths,
  selectedPaths,
  selectError,
  onSelectEntry,
}: FileManagerPanelProps) {
  const fm = useFileManager({ enabled });
  const [dragOver, setDragOver] = useState(false);

  const handleDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((event: DragEvent) => {
    event.preventDefault();
    if (event.currentTarget.contains(event.relatedTarget as Node)) return;
    setDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
      setDragOver(false);
      if (event.dataTransfer.files.length) {
        void fm.uploadFiles(event.dataTransfer.files);
      }
    },
    [fm]
  );

  const handleSelect = useCallback(
    (entry: StorageEntry, modifiers: FileSelectModifiers) => {
      onSelectEntry(entry, fm.entries, modifiers);
    },
    [fm.entries, onSelectEntry]
  );

  const displayError = selectError ?? fm.error;

  return (
    <div className="file-manager-panel">
      <div className="file-manager-stats">
        <span>
          {formatItemCount(fm.summary.itemCount)} · {formatBytes(fm.summary.totalBytes)} Total
        </span>
        {slotsLeft > 0 && (
          <span className="file-manager-stats-hint">
            Klik pilih · Ctrl+klik toggle · Shift+klik rentang · lalu Terapkan ({slotsLeft} slot)
          </span>
        )}
      </div>

      <BreadcrumbNav path={fm.currentPath} onNavigate={fm.navigate} />

      <FileToolbar
        searchQuery={fm.searchQuery}
        sortField={fm.sortField}
        sortDirection={fm.sortDirection}
        viewMode={fm.viewMode}
        uploading={fm.uploading}
        onSearchChange={fm.setSearchQuery}
        onSortFieldChange={fm.setSortField}
        onSortDirectionToggle={() =>
          fm.setSortDirection((dir) => (dir === "asc" ? "desc" : "asc"))
        }
        onViewModeChange={fm.setViewMode}
        onUpload={(files) => void fm.uploadFiles(files)}
        onCreateFolder={fm.createFolder}
      />

      {displayError && (
        <p className="file-manager-error" role="alert">
          {displayError}
        </p>
      )}

      <FileGrid
        entries={fm.entries}
        viewMode={fm.viewMode}
        loading={fm.loading}
        uploading={fm.uploading}
        selectedPaths={selectedPaths}
        attachedPaths={attachedPaths}
        dragOver={dragOver}
        onOpen={fm.openFolder}
        onSelect={handleSelect}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      />
    </div>
  );
}
