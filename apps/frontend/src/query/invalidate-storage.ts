import type { QueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/query/keys";

export async function invalidateStorageEntries(
  queryClient: QueryClient,
  path?: string
): Promise<void> {
  if (path !== undefined) {
    await queryClient.invalidateQueries({ queryKey: queryKeys.fileManager.entries(path) });
    return;
  }
  await queryClient.invalidateQueries({ queryKey: queryKeys.fileManager.all });
}
