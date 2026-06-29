export async function parseApiError(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { error?: string };
    if (data.error) return data.error;
  } catch {
    // ignore
  }
  return `Request failed (${response.status})`;
}

export async function request<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init);
  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
}

export async function requestVoid(input: RequestInfo, init?: RequestInit): Promise<void> {
  const response = await fetch(input, init);
  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }
}
