import { useEffect, useState } from "react";
import { cn } from "../lib/cn";
import { fillPromptTemplate, loadPromptShortcuts, type PromptShortcut } from "../lib/prompt-shortcuts";
import { Button, Card, CardTitle } from "./ui";

type PromptShortcutsPanelProps = {
  disabled?: boolean;
  onApply: (text: string) => void;
};

const variantClasses: Record<PromptShortcut["variant"], string> = {
  blue: "border-blue-500/30 bg-blue-500/10 text-blue-300",
  green: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
  amber: "border-amber-500/30 bg-amber-500/10 text-yellow-300",
  neutral: "border-slate-400/30 bg-slate-400/10 text-slate-300",
};

export function PromptShortcutsPanel({ disabled, onApply }: PromptShortcutsPanelProps) {
  const [shortcuts, setShortcuts] = useState<PromptShortcut[]>([]);

  useEffect(() => {
    void loadPromptShortcuts()
      .then(setShortcuts)
      .catch(() => setShortcuts([]));
  }, []);

  if (shortcuts.length === 0) return null;

  return (
    <Card className="-mt-2">
      <CardTitle>Knitto Shortcuts</CardTitle>
      <div className="mt-2 flex flex-wrap gap-2">
        {shortcuts.map((shortcut) => (
          <Button
            key={shortcut.id}
            variant="ghost"
            size="sm"
            className={cn("border", variantClasses[shortcut.variant])}
            disabled={disabled}
            onClick={() => onApply(fillPromptTemplate(shortcut.template, shortcut.defaults))}
          >
            {shortcut.icon ? `${shortcut.icon} ` : ""}
            {shortcut.label}
          </Button>
        ))}
      </div>
    </Card>
  );
}
