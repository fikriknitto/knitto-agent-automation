import { useQuery } from "@tanstack/react-query";
import { listStorageEntries } from "@/lib/api/file-manager-api";
import { queryKeys } from "@/query/keys";

type UseStorageEntriesOptions = {
  enabled?: boolean;
};

export function useStorageEntries(path: string, options: UseStorageEntriesOptions = {}) {
  const { enabled = true } = options;

  return useQuery({
    queryKey: queryKeys.fileManager.entries(path),
    queryFn: () => listStorageEntries(path),
    enabled,
  });
}
