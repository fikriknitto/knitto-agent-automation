import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createStorageFolder,
  deleteStorageEntry,
  renameStorageEntry,
  uploadStorageFiles,
} from "@/lib/api/file-manager-api";
import { queryKeys } from "@/query/keys";

function parentPath(path: string): string {
  const normalized = path.replace(/\\/g, "/").replace(/\/+$/, "");
  const lastSlash = normalized.lastIndexOf("/");
  if (lastSlash <= 0) return "";
  return normalized.slice(0, lastSlash);
}

export function useUploadStorageFiles() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ path, files }: { path: string; files: File[] }) =>
      uploadStorageFiles(path, files),
    onSuccess: async (_data, { path }) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.fileManager.entries(path) });
    },
  });
}

export function useCreateStorageFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ path, name }: { path: string; name: string }) =>
      createStorageFolder(path, name),
    onSuccess: async (_data, { path }) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.fileManager.entries(path) });
    },
  });
}

export function useRenameStorageEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ path, name }: { path: string; name: string }) =>
      renameStorageEntry(path, name),
    onSuccess: async (_data, { path }) => {
      const parent = parentPath(path);
      await queryClient.invalidateQueries({ queryKey: queryKeys.fileManager.entries(parent) });
    },
  });
}

export function useDeleteStorageEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (path: string) => deleteStorageEntry(path),
    onSuccess: async (_data, path) => {
      const parent = parentPath(path);
      await queryClient.invalidateQueries({ queryKey: queryKeys.fileManager.entries(parent) });
    },
  });
}

export function useStorageMutations(currentPath: string) {
  const upload = useUploadStorageFiles();
  const createFolder = useCreateStorageFolder();
  const renameEntry = useRenameStorageEntry();
  const deleteEntry = useDeleteStorageEntry();

  return {
    uploadFiles: (files: FileList | File[]) =>
      upload.mutateAsync({ path: currentPath, files: Array.from(files) }),
    createFolder: (name: string) => createFolder.mutateAsync({ path: currentPath, name }),
    renameEntry: (path: string, name: string) => renameEntry.mutateAsync({ path, name }),
    deleteEntry: (path: string) => deleteEntry.mutateAsync(path),
    isUploading: upload.isPending,
    isMutating:
      upload.isPending ||
      createFolder.isPending ||
      renameEntry.isPending ||
      deleteEntry.isPending,
  };
}
