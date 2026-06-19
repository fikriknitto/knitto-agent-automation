import type { BridgeSummary } from "../lib/types";

type BridgeCredentialsProps = {
  bridges: BridgeSummary[];
  selectedBridgeId: string;
  geminiKey: string;
  cursorKey: string;
  openRouterKey: string;
  nineRouterBaseUrl: string;
  nineRouterKey: string;
  statusMessage: string;
  onSelectBridge: (id: string) => void;
  onGeminiKeyChange: (value: string) => void;
  onCursorKeyChange: (value: string) => void;
  onOpenRouterKeyChange: (value: string) => void;
  onNineRouterBaseUrlChange: (value: string) => void;
  onNineRouterKeyChange: (value: string) => void;
  onSaveGemini: () => void;
  onSaveCursor: () => void;
  onSaveOpenRouter: () => void;
  onSaveNineRouter: () => void;
};

export function BridgeCredentials({
  bridges,
  selectedBridgeId,
  geminiKey,
  cursorKey,
  openRouterKey,
  nineRouterBaseUrl,
  nineRouterKey,
  statusMessage,
  onSelectBridge,
  onGeminiKeyChange,
  onCursorKeyChange,
  onOpenRouterKeyChange,
  onNineRouterBaseUrlChange,
  onNineRouterKeyChange,
  onSaveGemini,
  onSaveCursor,
  onSaveOpenRouter,
  onSaveNineRouter,
}: BridgeCredentialsProps) {
  const selected = bridges.find((b) => b.bridgeId === selectedBridgeId);
  const geminiBridge = bridges.find((b) => b.bridgeKind === "gemini");
  const cursorBridge = bridges.find((b) => b.bridgeKind === "cursor");
  const openRouterBridge = bridges.find((b) => b.bridgeKind === "openrouter");
  const nineRouterBridge = bridges.find((b) => b.bridgeKind === "ninerouter");

  console.log({
    bridges 
  })
  return (
    <section className="panel">
      <h2>Bridge credentials</h2>
      <p className="hint">
        Simpan credential per bridge, atau set env saat menjalankan bridge (
        <code>GEMINI_API_KEY</code>, <code>CURSOR_API_KEY</code>, <code>OPENROUTER_API_KEY</code>,{" "}
        <code>NINEROUTER_BASE_URL</code> / <code>NINEROUTER_API_KEY</code>).
      </p>

      {bridges.length > 1 && (
        <label>
          Active bridge (for chat)
          <select value={selectedBridgeId} onChange={(e) => onSelectBridge(e.target.value)}>
            <option value="">— select —</option>
            {bridges.map((b) => (
              <option key={b.bridgeId} value={b.bridgeId}>
                {b.bridgeLabel}
              </option>
            ))}
          </select>
        </label>
      )}

      <div className="cred-grid">
        <label>
          Gemini API key
          <input
            type="password"
            value={geminiKey}
            onChange={(e) => onGeminiKeyChange(e.target.value)}
            placeholder="AIza..."
            autoComplete="off"
            disabled={!geminiBridge}
          />
          <button
            type="button"
            onClick={onSaveGemini}
            disabled={!geminiBridge || !geminiKey.trim()}
          >
            Save to Gemini bridge
          </button>
          {!geminiBridge && <span className="hint">Gemini bridge offline — jalankan pnpm run start:bridge</span>}
        </label>

        <label>
          Cursor API key
          <input
            type="password"
            value={cursorKey}
            onChange={(e) => onCursorKeyChange(e.target.value)}
            placeholder="key_..."
            autoComplete="off"
            disabled={!cursorBridge}
          />
          <button
            type="button"
            onClick={onSaveCursor}
            disabled={!cursorBridge || !cursorKey.trim()}
          >
            Save to Cursor bridge
          </button>
          {!cursorBridge && <span className="hint">Cursor bridge offline</span>}
        </label>

        <label>
          OpenRouter API key
          <input
            type="password"
            value={openRouterKey}
            onChange={(e) => onOpenRouterKeyChange(e.target.value)}
            placeholder="sk-or-..."
            autoComplete="off"
            disabled={!openRouterBridge}
          />
          <button
            type="button"
            onClick={onSaveOpenRouter}
            disabled={!openRouterBridge || !openRouterKey.trim()}
          >
            Save to OpenRouter bridge
          </button>
          {!openRouterBridge && <span className="hint">OpenRouter bridge offline</span>}
        </label>

        <label>
          9Router base URL
          <input
            type="url"
            value={nineRouterBaseUrl}
            onChange={(e) => onNineRouterBaseUrlChange(e.target.value)}
            placeholder="http://localhost:20128"
            autoComplete="off"
            disabled={!nineRouterBridge}
          />
          9Router API key
          <input
            type="password"
            value={nineRouterKey}
            onChange={(e) => onNineRouterKeyChange(e.target.value)}
            placeholder="from 9Router dashboard"
            autoComplete="off"
            disabled={!nineRouterBridge}
          />
          <button
            type="button"
            onClick={onSaveNineRouter}
            disabled={!nineRouterBridge || !nineRouterBaseUrl.trim()}
          >
            Save to 9Router bridge
          </button>
          {!nineRouterBridge && (
            <span className="hint">9Router bridge offline — jalankan pnpm run start:bridge:ninerouter + app 9Router</span>
          )}
        </label>
      </div>

      {selected && (
        <p className="hint">
          Chat bridge: {selected.bridgeLabel} — default model {selected.defaultModel ?? "—"}
        </p>
      )}
      {statusMessage && <p className="status-message">{statusMessage}</p>}
    </section>
  );
}
