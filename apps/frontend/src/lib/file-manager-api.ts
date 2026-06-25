import type {
  CreateFolderBody,
  FileContentResponse,
  ListEntriesResponse,
  StorageEntry,
  UploadResponse,
} from "@knitto/shared";

async function parseError(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { error?: string };
    if (data.error) return data.error;
  } catch {
    // ignore
  }
  return `Request failed (${response.status})`;
}

export async function listStorageEntries(path = ""): Promise<ListEntriesResponse> {
  const params = new URLSearchParams();
  if (path) params.set("path", path);
  const query = params.toString();
  const response = await fetch(`/api/file-manager/entries${query ? `?${query}` : ""}`);
  if (!response.ok) throw new Error(await parseError(response));
  return response.json() as Promise<ListEntriesResponse>;
}

export async function uploadStorageFiles(path: string, files: File[]): Promise<StorageEntry[]> {
  const form = new FormData();
  form.set("path", path);
  for (const file of files) {
    form.append("files", file);
  }

  const response = await fetch("/api/file-manager/upload", {
    method: "POST",
    body: form,
  });
  if (!response.ok) throw new Error(await parseError(response));
  const data = (await response.json()) as UploadResponse;
  return data.entries;
}

export async function fetchStorageFileContent(path: string): Promise<FileContentResponse> {
  const params = new URLSearchParams({ path });
  const response = await fetch(`/api/file-manager/files/content?${params}`);
  if (!response.ok) throw new Error(await parseError(response));
  return response.json() as Promise<FileContentResponse>;
}

export async function createStorageFolder(path: string, name: string): Promise<StorageEntry> {
  const body: CreateFolderBody = { path, name };
  const response = await fetch("/api/file-manager/folders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(await parseError(response));
  const data = (await response.json()) as { entry: StorageEntry };
  return data.entry;
}

export async function renameStorageEntry(path: string, name: string): Promise<StorageEntry> {
  const response = await fetch("/api/file-manager/entries", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path, name }),
  });
  if (!response.ok) throw new Error(await parseError(response));
  const data = (await response.json()) as { entry: StorageEntry };
  return data.entry;
}

export async function deleteStorageEntry(path: string): Promise<void> {
  const response = await fetch("/api/file-manager/entries", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path }),
  });
  if (!response.ok) throw new Error(await parseError(response));
}
