import { SettingsIcon } from "lucide-react";
import type { BridgeSummary, ConnectionState } from "../lib/types";
import { Badge, Button } from "./ui";

type ChatHeaderProps = {
  bridges: BridgeSummary[];
  selectedBridgeId: string;
  connectionState: ConnectionState;
  bridgeAvailable: boolean;
  onOpenSettings: () => void;
};

export function ChatHeader({
  bridges,
  selectedBridgeId,
  connectionState,
  bridgeAvailable,
  onOpenSettings,
}: ChatHeaderProps) {
  const bridge = bridges.find((b) => b.bridgeId === selectedBridgeId);
  const connected = connectionState === "connected";
  const title = bridge?.bridgeLabel ?? "Knitto Agent";

  return (
    <header className="fixed left-0 right-0 top-0 z-[99999] flex h-12 shrink-0 items-center gap-3 border-b border-white/8 bg-[#0d0d0d]/95 px-3 backdrop-blur sm:px-4">
      <div className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-200">{title}</div>

      <div className="flex items-center gap-1.5">
        <Badge variant={connected ? "success" : "default"} className="hidden text-[0.65rem] sm:inline-flex">
          WS {connectionState}
        </Badge>
        <Badge
          variant={bridgeAvailable ? "success" : "default"}
          className="hidden text-[0.65rem] sm:inline-flex"
        >
          Bridge {bridgeAvailable ? "online" : "offline"}
        </Badge>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Open settings"
          title="Settings"
          onClick={onOpenSettings}
        >
         <SettingsIcon />
        </Button>
      </div>
    </header>
  );
}
