const HANDOFF_LINE_RE = /\[HANDOFF\]\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(\S+)/g;

export type HandoffState = Record<string, string>;

export function extractHandoffFromText(text: string): HandoffState {
  const state: HandoffState = {};
  let match: RegExpExecArray | null;
  HANDOFF_LINE_RE.lastIndex = 0;
  while ((match = HANDOFF_LINE_RE.exec(text)) !== null) {
    state[match[1]] = match[2];
  }
  return state;
}

export function mergeHandoffState(
  current: HandoffState,
  incoming: HandoffState
): HandoffState {
  return { ...current, ...incoming };
}

export function formatHandoffForPrompt(state: HandoffState): string {
  const entries = Object.entries(state);
  if (!entries.length) return "";
  const lines = entries.map(([key, value]) => `- ${key} = ${value}`);
  return `\nHandoff dari test case sebelumnya:\n${lines.join("\n")}\n`;
}

export function serializeHandoffInstruction(): string {
  return `Jika test case ini menghasilkan data untuk test case berikutnya, tulis baris:
[HANDOFF] KEY=value
(contoh: [HANDOFF] ORDER_NO=12345)`;
}
