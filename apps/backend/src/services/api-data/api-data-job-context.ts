/**
 * Per-job / MCP JWT for API Data (memory, shortcuts).
 * Stdio MCP reads process.env.API_DATA_TOKEN; in-process MCP uses module state.
 */

let currentToken: string | null = null;

export function setApiDataJobToken(token: string | null | undefined): void {
  currentToken = token?.trim() || null;
  if (currentToken) {
    process.env.API_DATA_TOKEN = currentToken;
  }
}

export function getApiDataJobToken(): string | null {
  const fromModule = currentToken?.trim();
  if (fromModule) return fromModule;
  const fromEnv = process.env.API_DATA_TOKEN?.trim();
  return fromEnv || null;
}

export function clearApiDataJobToken(): void {
  currentToken = null;
}
