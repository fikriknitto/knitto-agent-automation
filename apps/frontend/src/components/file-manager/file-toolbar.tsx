import { UploadIcon } from "lucide-react";
import { useRef, useState } from "react";
import type { SortDirection, SortField, ViewMode } from "../../hooks/use-file-manager";
import { Button, ButtonIcon, Input, Label, Select } from "../ui";

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
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <Label className="flex-1">
          <Input
            type="search"
            className="w-[150px]!"
            placeholder="Cari di folder ini…"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
          />
          
        </Label>

        <div className="flex flex-wrap gap-2">
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
          <Button
            variant="primary"
            size="sm"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? "Mengunggah…" : <><UploadIcon size={16} className="mr-1" /> Upload</>}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setFolderOpen((open) => !open)}>
            Folder baru
          </Button>
        </div>
      </div>

      {folderOpen && (
        <form
          className="flex flex-wrap items-center gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            void handleCreateFolder();
          }}
        >
          <Input
            className="min-w-[160px] flex-1"
            type="text"
            placeholder="Nama folder"
            value={folderName}
            autoFocus
            disabled={folderBusy}
            onChange={(event) => setFolderName(event.target.value)}
          />
          <Button type="submit" variant="primary" size="sm" disabled={folderBusy}>
            Buat
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={folderBusy}
            onClick={() => {
              setFolderOpen(false);
              setFolderName("");
            }}
          >
            Batal
          </Button>
        </form>
      )}

      <div className="flex flex-wrap items-center justify-end gap-2.5">
        <div className="flex items-center gap-1.5">
          <Label>
            <span className="sr-only">Urutkan</span>
            <Select
              className="px-2.5 py-1.5 text-[0.82rem]"
              value={sortField}
              onChange={(event) => onSortFieldChange(event.target.value as SortField)}
            >
              <option value="name">Nama</option>
              <option value="date">Tanggal</option>
              <option value="size">Ukuran</option>
            </Select>
          </Label>
          <ButtonIcon
            aria-label={sortDirection === "asc" ? "Urutan naik" : "Urutan turun"}
            onClick={onSortDirectionToggle}
          >
            {sortDirection === "asc" ? "↑" : "↓"}
          </ButtonIcon>
        </div>

        <div className="flex gap-1.5" role="group" aria-label="Tampilan">
          <ButtonIcon
            active={viewMode === "grid"}
            aria-pressed={viewMode === "grid"}
            onClick={() => onViewModeChange("grid")}
          >
            ⊞
          </ButtonIcon>
          <ButtonIcon
            active={viewMode === "list"}
            aria-pressed={viewMode === "list"}
            onClick={() => onViewModeChange("list")}
          >
            ☰
          </ButtonIcon>
        </div>
      </div>
    </div>
  );
}
