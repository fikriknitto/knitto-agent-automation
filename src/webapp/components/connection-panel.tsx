import type { ConnectionState } from "../lib/types";
import { DEFAULT_CHANNEL, DEFAULT_WS_HOST, DEFAULT_WS_PORT } from "../lib/protocol";

type ConnectionPanelProps = {
  host: string;
  port: string;
  channel: string;
  connectionState: ConnectionState;
  bridgeAvailable: boolean;
  browserHeaded?: boolean;
  onHostChange: (value: string) => void;
  onPortChange: (value: string) => void;
  onChannelChange: (value: string) => void;
  onConnect: () => void;
  onDisconnect: () => void;
  onRefresh: () => void;
};

export function ConnectionPanel({
  host,
  port,
  channel,
  connectionState,
  bridgeAvailable,
  browserHeaded,
  onHostChange,
  onPortChange,
  onChannelChange,
  onConnect,
  onDisconnect,
  onRefresh,
}: ConnectionPanelProps) {
  const connected = connectionState === "connected";

  return (
    <section className="panel">
      <h2>Connection</h2>
      <div className="field-row">
        <label>
          Host
          <input
            value={host}
            onChange={(e) => onHostChange(e.target.value)}
            placeholder={DEFAULT_WS_HOST}
            disabled={connected}
          />
        </label>
        <label>
          Port
          <input
            value={port}
            onChange={(e) => onPortChange(e.target.value)}
            placeholder={DEFAULT_WS_PORT}
            disabled={connected}
          />
        </label>
        <label>
          Channel
          <input
            value={channel}
            onChange={(e) => onChannelChange(e.target.value)}
            placeholder={DEFAULT_CHANNEL}
            disabled={connected}
          />
        </label>
      </div>
      <div className="button-row">
        {!connected ? (
          <button type="button" onClick={onConnect} disabled={connectionState === "connecting"}>
            {connectionState === "connecting" ? "Connecting…" : "Connect"}
          </button>
        ) : (
          <>
            <button type="button" onClick={onDisconnect}>
              Disconnect
            </button>
            <button type="button" onClick={onRefresh}>
              Refresh bridges
            </button>
          </>
        )}
      </div>
      <p className="status-line">
        Socket: <span className={`pill ${connected ? "online" : ""}`}>{connectionState}</span>
        Bridge:{" "}
        <span className={`pill ${bridgeAvailable ? "online" : ""}`}>
          {bridgeAvailable ? "Online" : "Offline"}
        </span>
      </p>
      {bridgeAvailable && typeof browserHeaded === "boolean" && (
        <p className="status-line">
          Browser:{" "}
          <span className={`pill ${browserHeaded ? "online" : ""}`}>
            {browserHeaded ? "Headed (visible)" : "Headless"}
          </span>
          <br/>
          <span className="hint">Set AUTOMATION_HEADLESS=false on bridge for headed mode.</span>
        </p>
      )}
    </section>
  );
}
