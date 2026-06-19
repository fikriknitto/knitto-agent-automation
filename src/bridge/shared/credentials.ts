import type WebSocket from "ws";
import type { BridgeKind } from "./types.js";

export function requestBridgeCredentials(
  ws: WebSocket,
  bridgeId: string,
  bridgeKind: BridgeKind
): void {
  ws.send(
    JSON.stringify({
      type: "bridge_credentials_request",
      bridgeId,
      bridgeKind,
    })
  );
}
