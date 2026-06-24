import type { MouseEvent } from "react";
import type { StorageEntry } from "@knitto/shared";
import {
  ENTRY_ICON_LABEL,
  formatBytes,
  resolveEntryIcon,
} from "../../lib/file-utils";
import { isAcceptedStorageEntry } from "../../lib/prompt-attachment";

export type FileSelectModifiers = {
  ctrlKey: boolean;
  shiftKey: boolean;
  metaKey: boolean;
};

type FileCardProps = {
  entry: StorageEntry;
  viewMode: "grid" | "list";
  selected: boolean;
  alreadyAttached: boolean;
  onOpen: (entry: StorageEntry) => void;
  onSelect: (entry: StorageEntry, modifiers: FileSelectModifiers) => void;
};

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function emptyModifiers(): FileSelectModifiers {
  return { ctrlKey: false, shiftKey: false, metaKey: false };
}

export function FileCard({
  entry,
  viewMode,
  selected,
  alreadyAttached,
  onOpen,
  onSelect,
}: FileCardProps) {
  const iconKind = resolveEntryIcon(entry.type, entry.extension);
  const icon = ENTRY_ICON_LABEL[iconKind];
  const isFolder = entry.type === "folder";
  const attachable = !isFolder && isAcceptedStorageEntry(entry.name, entry.mimeType);

  const handleMouseDown = (event: MouseEvent) => {
    if (event.shiftKey || event.ctrlKey || event.metaKey) {
      event.preventDefault();
    }
  };

  const handleClick = (event: MouseEvent) => {
    if (isFolder) {
      onOpen(entry);
      return;
    }
    if (!attachable || alreadyAttached) return;
    onSelect(entry, {
      ctrlKey: event.ctrlKey,
      shiftKey: event.shiftKey,
      metaKey: event.metaKey,
    });
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    if (isFolder) {
      onOpen(entry);
      return;
    }
    if (attachable && !alreadyAttached) onSelect(entry, emptyModifiers());
  };

  const className = [
    viewMode === "list" ? "file-manager-row" : "file-manager-card",
    isFolder ? "is-folder" : "",
    !isFolder && attachable && !alreadyAttached ? "is-selectable" : "",
    !isFolder && (!attachable || alreadyAttached) ? "is-disabled" : "",
    selected ? "is-selected" : "",
    alreadyAttached ? "is-attached" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const title = isFolder
    ? `Buka folder ${entry.name}`
    : alreadyAttached
      ? `${entry.name} — sudah dilampirkan`
      : attachable
        ? `${entry.name} — klik pilih, Ctrl+klik toggle, Shift+klik rentang`
        : `${entry.name} — tipe tidak didukung (executable / tanpa ekstensi)`;

  if (viewMode === "list") {
    return (
      <div
        className={className}
        role="button"
        tabIndex={0}
        title={title}
        aria-pressed={!isFolder && attachable ? selected : undefined}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onKeyDown={handleKeyDown}
      >
        <span className="file-manager-row-icon" aria-hidden="true">
          {icon}
        </span>
        <span className="file-manager-row-name">{entry.name}</span>
        <span className="file-manager-row-meta">
          {isFolder ? "Folder" : formatBytes(entry.size ?? 0)}
        </span>
        <span className="file-manager-row-date">{formatDate(entry.updatedAt)}</span>
        {selected && <span className="file-manager-selected-mark" aria-hidden="true">✓</span>}
      </div>
    );
  }

  return (
    <div
      className={className}
      role="button"
      tabIndex={0}
      title={title}
      aria-pressed={!isFolder && attachable ? selected : undefined}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onKeyDown={handleKeyDown}
    >
      {selected && <span className="file-manager-selected-mark" aria-hidden="true">✓</span>}
      <div className="file-manager-card-icon" aria-hidden="true">
        {icon}
      </div>
      <p className="file-manager-card-name">{entry.name}</p>
      <p className="file-manager-card-meta">
        {isFolder
          ? "Folder"
          : `${formatBytes(entry.size ?? 0)} · ${formatDate(entry.updatedAt)}`}
      </p>
    </div>
  );
}
