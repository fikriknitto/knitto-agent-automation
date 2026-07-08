import type { AutomationPlatform, MobileConfig } from "@knitto/shared";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BridgeCredentials } from "./components/bridge-credentials";
import { ChatHeader } from "./components/chat-header";
import { ChatMain } from "./components/chat-main";
import { ConnectionPanel } from "./components/connection-panel";
import { PromptShortcutsSettings } from "./components/prompt-shortcuts-settings";
import { AppMemorySettings } from "./components/app-memory-settings";
import { SettingsModal } from "./components/settings-modal";
import { type PromptAttachment } from "./lib/prompt-attachment";
import { type AppliedPromptShortcut, promptShortcutPath } from "./lib/prompt-compose";
import { DEFAULT_CHANNEL, DEFAULT_WS_HOST, DEFAULT_WS_PORT } from "./lib/protocol";
import type { PromptShortcut } from "./lib/prompt-shortcuts";
import { isActiveJobStatus, syncActiveJobIds } from "./lib/active-jobs";
import { mergeAgentChatLine } from "./lib/merge-agent-chat-line";
import type { BridgeSummary, ChatLine, ConnectionState } from "./lib/types";
import { AutomationWsClient } from "./lib/ws-client";
import { toMobileConfigPayload } from "./components/platform-selector";
import { MobileDevicesProvider } from "./contexts/mobile-devices-context";

const STORAGE_KEY = "knitto-automation-web";

type PersistedState = {
  host?: string;
  port?: string;
  channel?: string;
  useWss?: boolean;
  selectedBridgeId?: string;
  selectedModel?: string;
  strategy?: string;
  cursorKey?: string;
  geminiKey?: string;
  openRouterKey?: string;
  nineRouterBaseUrl?: string;
  nineRouterKey?: string;
  platform?: AutomationPlatform;
  mobileConfig?: MobileConfig;
};

function loadState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PersistedState) : {};
  } catch {
    return {};
  }
}

function saveState(state: PersistedState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

function jobId(): string {
  return `job-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function App() {
  const persisted = useMemo(() => loadState(), []);
  const [host, setHost] = useState(persisted.host ?? DEFAULT_WS_HOST);
  const [port, setPort] = useState(persisted.port ?? DEFAULT_WS_PORT);
  const [channel, setChannel] = useState(persisted.channel ?? DEFAULT_CHANNEL);
  const [useWss, setUseWss] = useState(persisted.useWss ?? false);
  const [connectionState, setConnectionState] = useState<ConnectionState>("disconnected");
  const [bridgeAvailable, setBridgeAvailable] = useState(false);
  const [bridges, setBridges] = useState<BridgeSummary[]>([]);
  const [selectedBridgeId, setSelectedBridgeId] = useState(persisted.selectedBridgeId ?? "");
  const [selectedModel, setSelectedModel] = useState(persisted.selectedModel ?? "");
  const [strategy] = useState(persisted.strategy ?? "automation_human_strategy");
  const [platform, setPlatform] = useState<AutomationPlatform>(persisted.platform ?? "browser");
  const [mobileConfig, setMobileConfig] = useState<MobileConfig>(
    persisted.mobileConfig ?? { appPackage: "" }
  );
  const [prompt, setPrompt] = useState("");
  const [promptBases, setPromptBases] = useState<AppliedPromptShortcut[]>([]);
  const [promptAttachments, setPromptAttachments] = useState<PromptAttachment[]>([]);
  const [chatLines, setChatLines] = useState<ChatLine[]>([]);
  const [workerState, setWorkerState] = useState<"idle" | "busy">("idle");
  const [cursorKey, setCursorKey] = useState(persisted.cursorKey ?? "");
  const [geminiKey, setGeminiKey] = useState(persisted.geminiKey ?? "");
  const [openRouterKey, setOpenRouterKey] = useState(persisted.openRouterKey ?? "");
  const [nineRouterBaseUrl, setNineRouterBaseUrl] = useState(
    persisted.nineRouterBaseUrl ?? "http://localhost:20128"
  );
  const [nineRouterKey, setNineRouterKey] = useState(persisted.nineRouterKey ?? "");
  const [credStatus, setCredStatus] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);

  const lastSubmittedJobId = useRef<string | null>(null);
  const activeJobIds = useRef(new Set<string>());
  const wsRef = useRef<AutomationWsClient | null>(null);

  useEffect(() => {
    saveState({
      host,
      port,
      channel,
      useWss,
      selectedBridgeId,
      selectedModel,
      strategy,
      cursorKey,
      geminiKey,
      openRouterKey,
      nineRouterBaseUrl,
      nineRouterKey,
      platform,
      mobileConfig: mobileConfig.appPackage ? mobileConfig : undefined,
    });
  }, [
    host,
    port,
    channel,
    useWss,
    selectedBridgeId,
    selectedModel,
    strategy,
    cursorKey,
    geminiKey,
    openRouterKey,
    nineRouterBaseUrl,
    nineRouterKey,
    platform,
    mobileConfig,
  ]);

  useEffect(() => {
    if (!selectedBridgeId && bridges.length) {
      setSelectedBridgeId(bridges[0]!.bridgeId);
    }
  }, [bridges, selectedBridgeId]);

  const ensureClient = useCallback(() => {
    if (wsRef.current) return wsRef.current;

    const client = new AutomationWsClient({
      onConnectionState: setConnectionState,
      onBridges: setBridges,
      onBridgeAvailable: setBridgeAvailable,
      onAgentJob: (msg) => {
        setWorkerState(syncActiveJobIds(msg.id, msg.status, activeJobIds.current));
        if (!isActiveJobStatus(msg.status) && lastSubmittedJobId.current === msg.id) {
          lastSubmittedJobId.current = null;
        }
        wsRef.current?.clearSubmittedJob(msg.id, msg.status);

        setChatLines((prev) => {
          const idx = prev.findIndex((l) => l.id === msg.id && l.role === "agent");
          const prevLine = idx >= 0 ? prev[idx] : undefined;
          const line = mergeAgentChatLine(msg, prevLine);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = line;
            return next;
          }
          return [...prev, line];
        });
      },
      onCredentialsRequest: () => {
        setCredStatus("Bridge requested API credentials — save keys below.");
      },
      onCredentialsStatus: (payload) => {
        setCredStatus(payload.valid ? "Credentials verified." : payload.message);
      },
    });

    wsRef.current = client;
    return client;
  }, []);

  const handleConnect = useCallback(() => {
    ensureClient().connect(host, port, channel, useWss);
  }, [ensureClient, host, port, channel, useWss]);

  const handleDisconnect = () => {
    wsRef.current?.disconnect();
  };

  const handleRefresh = () => {
    wsRef.current?.refreshStatus();
  };

  const handleSend = () => {
    const main = prompt.trim();
    const basePaths = promptBases.map((b) => promptShortcutPath(b.id));
    if ((!main && !promptAttachments.length && !basePaths.length) || !selectedBridgeId) return;

    const bridge = bridges.find((b) => b.bridgeId === selectedBridgeId);

    const id = jobId();
    lastSubmittedJobId.current = id;
    activeJobIds.current.add(id);

    const attachments = promptAttachments.length ? [...promptAttachments] : undefined;
    const baseSnapshot = promptBases.map((b) => ({
      id: b.id,
      label: b.label,
      icon: b.icon,
      variant: b.variant,
      path: promptShortcutPath(b.id),
    }));

    setChatLines((prev) => [
      ...prev,
      {
        id: `u-${id}`,
        role: "user",
        text: main,
        promptBases: baseSnapshot.length ? baseSnapshot : undefined,
        attachments,
      },
      {
        id,
        role: "agent",
        text: "Memulai…",
        status: "running",
        progress: 0,
      },
    ]);
    setWorkerState("busy");
    setPrompt("");
    setPromptBases([]);
    setPromptAttachments([]);

    wsRef.current?.sendUserPrompt({
      id,
      bridgeId: selectedBridgeId,
      text: main || "Gunakan lampiran sesuai instruksi di prompt user.",
      promptBasePaths: basePaths.length ? basePaths : undefined,
      mainPrompt: main || undefined,
      strategy,
      model:
        selectedModel ||
        bridge?.defaultModel ||
        bridge?.models?.[0]?.id ||
        "",
      attachments,
      platform,
      mobileConfig: platform === "mobile" ? toMobileConfigPayload(mobileConfig) : undefined,
    });
  };

  const handleAddPromptBase = useCallback((shortcut: PromptShortcut, filledText: string) => {
    if (!filledText.trim()) return;
    const entry: AppliedPromptShortcut = {
      id: shortcut.id,
      label: shortcut.label,
      icon: shortcut.icon,
      variant: shortcut.variant,
      filledText,
    };
    setPromptBases((prev) => {
      const without = prev.filter((b) => b.id !== shortcut.id);
      return [...without, entry];
    });
  }, []);

  const handleRemovePromptBase = useCallback((id: string) => {
    setPromptBases((prev) => prev.filter((b) => b.id !== id));
  }, []);

  const handleApplyMainPrompt = useCallback((filledText: string) => {
    setPrompt(filledText);
  }, []);

  const handleCancel = () => {
    const id = lastSubmittedJobId.current;
    if (!id || !selectedBridgeId || workerState !== "busy") return;
    wsRef.current?.cancelJob({ id, bridgeId: selectedBridgeId });
  };

  const selectedBridge = bridges.find((b) => b.bridgeId === selectedBridgeId);
  const browserHeaded = selectedBridge?.browserHeaded;

  const sendCred = async (bridgeKind: "cursor" | "gemini" | "openrouter", apiKey: string) => {
    const bridge = bridges.find((b) => b.bridgeKind === bridgeKind);
    const bridgeId = bridge?.bridgeId ?? selectedBridgeId;
    if (!bridgeId || !apiKey.trim()) return;
    wsRef.current?.sendCredentials({ bridgeId, bridgeKind, apiKey: apiKey.trim() });
    setCredStatus(`Sent ${bridgeKind} credentials…`);
  };

  const sendNineRouterCred = async () => {
    const bridge = bridges.find((b) => b.bridgeKind === "ninerouter");
    const bridgeId = bridge?.bridgeId ?? selectedBridgeId;
    const baseUrl = nineRouterBaseUrl.trim();
    if (!bridgeId || !baseUrl) return;
    wsRef.current?.sendCredentials({
      bridgeId,
      bridgeKind: "ninerouter",
      nineRouter: { baseUrl, apiKey: nineRouterKey.trim() },
    });
    setCredStatus("Sent 9Router credentials…");
  };

  return (
    <MobileDevicesProvider enabled={platform === "mobile"}>
    <div className="flex h-screen flex-col bg-[#0d0d0d]">
      <ChatHeader
        bridges={bridges}
        selectedBridgeId={selectedBridgeId}
        connectionState={connectionState}
        bridgeAvailable={bridgeAvailable}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <ChatMain
        bridges={bridges}
        prompt={prompt}
        promptBases={promptBases}
        promptAttachments={promptAttachments}
        platform={platform}
        mobileConfig={mobileConfig}
        workerState={workerState}
        connectionState={connectionState}
        selectedBridgeId={selectedBridgeId}
        selectedModel={selectedModel}
        chatLines={chatLines}
        onPromptChange={setPrompt}
        onAddPromptBase={handleAddPromptBase}
        onRemovePromptBase={handleRemovePromptBase}
        onApplyMainPrompt={handleApplyMainPrompt}
        onPromptAttachmentsChange={setPromptAttachments}
        onSelectBridge={setSelectedBridgeId}
        onSelectModel={setSelectedModel}
        onPlatformChange={setPlatform}
        onMobileConfigChange={setMobileConfig}
        onSend={handleSend}
        onCancel={handleCancel}
      />

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        connection={
          <>
            <ConnectionPanel
              embedded
              host={host}
              port={port}
              channel={channel}
              useWss={useWss}
              connectionState={connectionState}
              bridgeAvailable={bridgeAvailable}
              browserHeaded={browserHeaded}
              onHostChange={setHost}
              onPortChange={setPort}
              onChannelChange={setChannel}
              onUseWssChange={setUseWss}
              onConnect={handleConnect}
              onDisconnect={handleDisconnect}
              onRefresh={handleRefresh}
            />
            <BridgeCredentials
              embedded
              bridges={bridges}
              selectedBridgeId={selectedBridgeId}
              geminiKey={geminiKey}
              cursorKey={cursorKey}
              openRouterKey={openRouterKey}
              nineRouterBaseUrl={nineRouterBaseUrl}
              nineRouterKey={nineRouterKey}
              statusMessage={credStatus}
              onSelectBridge={setSelectedBridgeId}
              onGeminiKeyChange={setGeminiKey}
              onCursorKeyChange={setCursorKey}
              onOpenRouterKeyChange={setOpenRouterKey}
              onNineRouterBaseUrlChange={setNineRouterBaseUrl}
              onNineRouterKeyChange={setNineRouterKey}
              onSaveGemini={() => void sendCred("gemini", geminiKey)}
              onSaveCursor={() => void sendCred("cursor", cursorKey)}
              onSaveOpenRouter={() => void sendCred("openrouter", openRouterKey)}
              onSaveNineRouter={() => void sendNineRouterCred()}
            />
          </>
        }
        templates={
          <PromptShortcutsSettings
            selectedBridgeId={selectedBridgeId}
            selectedModel={selectedModel}
            connectionState={connectionState}
          />
        }
        memory={<AppMemorySettings />}
      />
    </div>
    </MobileDevicesProvider>
  );
}
export default App;
