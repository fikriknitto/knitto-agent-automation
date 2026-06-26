import { useCallback, useEffect, useState } from "react";
import {
  fetchPromptShortcuts,
  type PromptShortcut,
} from "../lib/prompt-shortcuts";
import { PromptShortcutApplyModal } from "./prompt-shortcut-apply-modal";
import { PromptShortcutItem } from "./prompt-shortcut-item";

type PromptShortcutsPanelProps = {
  disabled?: boolean;
  onAddPromptBase: (shortcut: PromptShortcut, filledText: string) => void;
  onApplyMainPrompt: (filledText: string) => void;
};

export function PromptShortcutsPanel({
  disabled,
  onAddPromptBase,
  onApplyMainPrompt,
}: PromptShortcutsPanelProps) {
  const [shortcuts, setShortcuts] = useState<PromptShortcut[]>([]);
  const [loadError, setLoadError] = useState("");
  const [pendingShortcut, setPendingShortcut] = useState<PromptShortcut | null>(null);

  const reload = useCallback(async () => {
    try {
      const items = await fetchPromptShortcuts();
      setShortcuts(items);
      setLoadError("");
    } catch (err) {
      setShortcuts([]);
      setLoadError(err instanceof Error ? err.message : "Gagal memuat prompt shortcuts");
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const handleSelect = (shortcut: PromptShortcut) => {
    if (disabled) return;
    setPendingShortcut(shortcut);
  };

  const handleChoose = (type: "base" | "main", filledText: string) => {
    if (!pendingShortcut) return;
    if (type === "base") {
      onAddPromptBase(pendingShortcut, filledText);
    } else {
      onApplyMainPrompt(filledText);
    }
    setPendingShortcut(null);
  };

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-slate-500">Template</span>
        </div>

        {loadError && <p className="m-0 text-xs text-red-400">{loadError}</p>}

        {shortcuts.length === 0 ? (
          <p className="m-0 text-xs text-slate-500">Belum ada prompt shortcut.</p>
        ) : (
          <div className="flex flex-nowrap gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {shortcuts.map((shortcut) => (
              <PromptShortcutItem
                key={shortcut.id}
                shortcut={shortcut}
                manageMode={false}
                disabled={disabled}
                onSelect={handleSelect}
                onEdit={() => {}}
                onDelete={() => {}}
              />
            ))}
          </div>
        )}
      </div>

      <PromptShortcutApplyModal
        shortcut={pendingShortcut}
        open={pendingShortcut !== null}
        onClose={() => setPendingShortcut(null)}
        onChoose={handleChoose}
      />
    </>
  );
}
