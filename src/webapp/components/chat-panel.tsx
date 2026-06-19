import { STRATEGIES } from "../lib/protocol";
import type { BridgeSummary, ChatLine, ConnectionState } from "../lib/types";
import { ChatHistory } from "./job-progress";
import { PromptEditor } from "./prompt-editor";

type ChatPanelProps = {
  bridges: BridgeSummary[];
  selectedBridgeId: string;
  selectedModel: string;
  strategy: string;
  prompt: string;
  workerState: "idle" | "busy";
  connectionState: ConnectionState;
  chatLines: ChatLine[];
  onSelectBridge: (id: string) => void;
  onSelectModel: (id: string) => void;
  onStrategyChange: (id: string) => void;
  onPromptChange: (value: string) => void;
  onSend: () => void;
  onCancel: () => void;
};

function resolveModelForBridge(
  bridge: BridgeSummary | undefined,
  selectedModel: string
): string {
  if (!bridge?.models?.length) return "";
  if (selectedModel && bridge.models.some((m) => m.id === selectedModel)) {
    return selectedModel;
  }
  if (bridge.defaultModel && bridge.models.some((m) => m.id === bridge.defaultModel)) {
    return bridge.defaultModel;
  }
  return bridge.models[0]!.id;
}

export function ChatPanel({
  bridges,
  selectedBridgeId,
  selectedModel,
  strategy,
  prompt,
  workerState,
  connectionState,
  chatLines,
  onSelectBridge,
  onSelectModel,
  onStrategyChange,
  onPromptChange,
  onSend,
  onCancel,
}: ChatPanelProps) {
  const bridge = bridges.find((b) => b.bridgeId === selectedBridgeId);
  const model = resolveModelForBridge(bridge, selectedModel);
  const models = bridge?.models ?? [];

  return (
    <section className="panel chat-panel">
      <h2>Automation chat</h2>
      <div className="field-row">
        <label>
          Bridge
          <select value={selectedBridgeId} onChange={(e) => onSelectBridge(e.target.value)}>
            <option value="">— select —</option>
            {bridges.map((b) => (
              <option key={b.bridgeId} value={b.bridgeId}>
                {b.bridgeLabel}
              </option>
            ))}
          </select>
        </label>
        <label>
          Model
          <select
            value={model}
            onChange={(e) => onSelectModel(e.target.value)}
            disabled={!models.length}
          >
            {models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Strategy
          <select value={strategy} onChange={(e) => onStrategyChange(e.target.value)}>
            {STRATEGIES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <ChatHistory lines={chatLines} />

      <div className="prompt-label">
        <span className="prompt-label-text">Prompt</span>
        <PromptEditor
          value={prompt}
          connectionState={connectionState}
          selectedBridgeId={selectedBridgeId}
          workerState={workerState}
          onChange={onPromptChange}
          onSend={onSend}
          onCancel={onCancel}
        />
      </div>
    </section>
  );
}
