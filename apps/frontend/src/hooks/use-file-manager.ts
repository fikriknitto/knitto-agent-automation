import { useCallback, useEffect, useMemo, useState } from "react";
import type { ListEntriesResponse, StorageEntry, StorageSummary } from "@knitto/shared";
import {
  createStorageFolder,
  deleteStorageEntry,
  listStorageEntries,
  renameStorageEntry,
  uploadStorageFiles,
} from "../lib/file-manager-api";

export type SortField = "name" | "date" | "size";
export type SortDirection = "asc" | "desc";
export type ViewMode = "grid" | "list";

type UseFileManagerOptions = {
  enabled: boolean;
};

export function useFileManager({ enabled }: UseFileManagerOptions) {
  const [currentPath, setCurrentPath] = useState("");
  const [entries, setEntries] = useState<StorageEntry[]>([]);
  const [summary, setSummary] = useState<StorageSummary>({ itemCount: 0, totalBytes: 0 });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result: ListEntriesResponse = await listStorageEntries(currentPath);
      setEntries(result.entries);
      setSummary(result.summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat file");
    } finally {
      setLoading(false);
    }
  }, [currentPath]);

  useEffect(() => {
    if (!enabled) return;
    void refresh();
  }, [enabled, refresh]);

  const navigate = useCallback((path: string) => {
    setSearchQuery("");
    setCurrentPath(path);
  }, []);

  const openFolder = useCallback((entry: StorageEntry) => {
    if (entry.type !== "folder") return;
    navigate(entry.path);
  }, [navigate]);

  const uploadFiles = useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files);
      if (!list.length) return;
      setUploading(true);
      setError(null);
      try {
        await uploadStorageFiles(currentPath, list);
        await refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal mengunggah file");
      } finally {
        setUploading(false);
      }
    },
    [currentPath, refresh]
  );

  const createFolder = useCallback(
    async (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      setError(null);
      try {
        await createStorageFolder(currentPath, trimmed);
        await refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal membuat folder");
        throw err;
      }
    },
    [currentPath, refresh]
  );

  const renameEntry = useCallback(
    async (path: string, name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return null;
      setError(null);
      try {
        const entry = await renameStorageEntry(path, trimmed);
        await refresh();
        return entry;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal mengubah nama");
        throw err;
      }
    },
    [refresh]
  );

  const deleteEntry = useCallback(
    async (path: string) => {
      setError(null);
      try {
        await deleteStorageEntry(path);
        await refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal menghapus");
        throw err;
      }
    },
    [refresh]
  );

  const visibleEntries = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    let list = query
      ? entries.filter((entry) => entry.name.toLowerCase().includes(query))
      : [...entries];

    const dir = sortDirection === "asc" ? 1 : -1;
    list.sort((a, b) => {
      if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
      if (sortField === "date") {
        return dir * (Date.parse(a.updatedAt) - Date.parse(b.updatedAt));
      }
      if (sortField === "size") {
        const aSize = a.size ?? 0;
        const bSize = b.size ?? 0;
        return dir * (aSize - bSize);
      }
      return dir * a.name.localeCompare(b.name);
    });

    return list;
  }, [entries, searchQuery, sortField, sortDirection]);

  return {
    currentPath,
    entries: visibleEntries,
    summary,
    loading,
    uploading,
    error,
    searchQuery,
    sortField,
    sortDirection,
    viewMode,
    setSearchQuery,
    setSortField,
    setSortDirection,
    setViewMode,
    navigate,
    openFolder,
    uploadFiles,
    createFolder,
    renameEntry,
    deleteEntry,
    refresh,
    setError,
  };
}
