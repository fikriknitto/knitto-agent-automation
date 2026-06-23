import { useRef, useState } from "react";
import type { SortDirection, SortField, ViewMode } from "../../hooks/use-file-manager";

type FileToolbarProps = {
  searchQuery: string;
  sortField: SortField;
  sortDirection: SortDirection;
  viewMode: ViewMode;
  uploading: boolean;
  onSearchChange: (value: string) => void;
  onSortFieldChange: (value: SortField) => void;
  onSortDirectionToggle: () => void;
  onViewModeChange: (value: ViewMode) => void;
  onUpload: (files: FileList | File[]) => void;
  onCreateFolder: (name: string) => Promise<void>;
};

export function FileToolbar({
  searchQuery,
  sortField,
  sortDirection,
  viewMode,
  uploading,
  onSearchChange,
  onSortFieldChange,
  onSortDirectionToggle,
  onViewModeChange,
  onUpload,
  onCreateFolder,
}: FileToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [folderOpen, setFolderOpen] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [folderBusy, setFolderBusy] = useState(false);

  const handleCreateFolder = async () => {
    if (!folderName.trim() || folderBusy) return;
    setFolderBusy(true);
    try {
      await onCreateFolder(folderName);
      setFolderName("");
      setFolderOpen(false);
    } catch {
      // error surfaced by parent
    } finally {
      setFolderBusy(false);
    }
  };

  return (
    <div className="file-manager-toolbar">
      <div className="file-manager-toolbar-row">
        <label className="file-manager-search">
          <span className="sr-only">Cari file</span>
          <input
            type="search"
            placeholder="Cari di folder ini…"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </label>

        <div className="file-manager-toolbar-actions">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="sr-only"
            onChange={(event) => {
              if (event.target.files?.length) {
                onUpload(event.target.files);
                event.target.value = "";
              }
            }}
          />
          <button
            type="button"
            className="file-manager-btn file-manager-btn-primary"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? "Mengunggah…" : "Upload"}
          </button>
          <button
            type="button"
            className="file-manager-btn"
            onClick={() => setFolderOpen((open) => !open)}
          >
            Folder baru
          </button>
        </div>
      </div>

      {folderOpen && (
        <form
          className="file-manager-create-folder"
          onSubmit={(event) => {
            event.preventDefault();
            void handleCreateFolder();
          }}
        >
          <input
            type="text"
            placeholder="Nama folder"
            value={folderName}
            autoFocus
            disabled={folderBusy}
            onChange={(event) => setFolderName(event.target.value)}
          />
          <button type="submit" className="file-manager-btn file-manager-btn-primary" disabled={folderBusy}>
            Buat
          </button>
          <button
            type="button"
            className="file-manager-btn"
            disabled={folderBusy}
            onClick={() => {
              setFolderOpen(false);
              setFolderName("");
            }}
          >
            Batal
          </button>
        </form>
      )}

      <div className="file-manager-toolbar-row file-manager-toolbar-meta">
        <div className="file-manager-sort">
          <label>
            <span className="sr-only">Urutkan</span>
            <select
              value={sortField}
              onChange={(event) => onSortFieldChange(event.target.value as SortField)}
            >
              <option value="name">Nama</option>
              <option value="date">Tanggal</option>
              <option value="size">Ukuran</option>
            </select>
          </label>
          <button
            type="button"
            className="file-manager-btn file-manager-btn-icon"
            aria-label={sortDirection === "asc" ? "Urutan naik" : "Urutan turun"}
            onClick={onSortDirectionToggle}
          >
            {sortDirection === "asc" ? "↑" : "↓"}
          </button>
        </div>

        <div className="file-manager-view-toggle" role="group" aria-label="Tampilan">
          <button
            type="button"
            className={`file-manager-btn file-manager-btn-icon${viewMode === "grid" ? " is-active" : ""}`}
            aria-pressed={viewMode === "grid"}
            onClick={() => onViewModeChange("grid")}
          >
            ⊞
          </button>
          <button
            type="button"
            className={`file-manager-btn file-manager-btn-icon${viewMode === "list" ? " is-active" : ""}`}
            aria-pressed={viewMode === "list"}
            onClick={() => onViewModeChange("list")}
          >
            ☰
          </button>
        </div>
      </div>
    </div>
  );
}
