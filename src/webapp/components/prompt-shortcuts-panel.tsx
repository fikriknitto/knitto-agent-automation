import { fillPromptTemplate, PROMPT_SHORTCUTS } from "../lib/prompt-shortcuts";

type PromptShortcutsPanelProps = {
  disabled?: boolean;
  onApply: (text: string) => void;
};

export function PromptShortcutsPanel({ disabled, onApply }: PromptShortcutsPanelProps) {
  if (PROMPT_SHORTCUTS.length === 0) return null;

  return (
    <section className="panel prompt-shortcuts-panel">
      <h2>Knitto Shortcuts</h2>
      <div className="prompt-shortcuts-list">
        {PROMPT_SHORTCUTS.map((shortcut) => (
          <button
            key={shortcut.id}
            type="button"
            className={`prompt-shortcut-btn variant-${shortcut.variant}`}
            disabled={disabled}
            onClick={() => onApply(fillPromptTemplate(shortcut.template, shortcut.defaults))}
          >
            {shortcut.icon ? `${shortcut.icon} ` : ""}
            {shortcut.label}
          </button>
        ))}
      </div>
    </section>
  );
}
