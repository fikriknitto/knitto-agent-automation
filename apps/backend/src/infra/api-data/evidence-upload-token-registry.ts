/**
 * In-memory JWT registry for deferred evidence upload flush.
 * Tokens are never written to disk (W7).
 */

type Entry = {
  token: string;
  runId: number;
  updatedAt: number;
};

const tokens = new Map<string, Entry>();

export function rememberEvidenceUploadToken(
  agentJobId: string,
  token: string,
  runId: number
): void {
  const trimmed = token.trim();
  if (!trimmed || !agentJobId) return;
  tokens.set(agentJobId, {
    token: trimmed,
    runId,
    updatedAt: Date.now(),
  });
}

export function getEvidenceUploadToken(
  agentJobId: string
): Entry | undefined {
  return tokens.get(agentJobId);
}

export function listEvidenceUploadTokenEntries(): Array<
  { agentJobId: string } & Entry
> {
  return [...tokens.entries()].map(([agentJobId, entry]) => ({
    agentJobId,
    ...entry,
  }));
}
