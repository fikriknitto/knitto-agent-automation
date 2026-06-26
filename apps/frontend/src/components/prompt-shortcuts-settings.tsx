import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  deletePromptShortcut,
  fetchPromptShortcuts,
  type PromptShortcut,
} from "../lib/prompt-shortcuts";
import type { ConnectionState } from "../lib/types";
import { cn } from "../lib/cn";
import {
  DeletePromptShortcutModal,
  PromptShortcutFormModal,
} from "./prompt-shortcut-form-modal";
import { Button } from "./ui";

const variantClasses: Record<PromptShortcut["variant"], string> = {
  blue: "text-blue-300",
  green: "text-emerald-200",
  amber: "text-yellow-300",
  neutral: "text-slate-300",
};

type PromptShortcutsSettingsProps = {
  selectedBridgeId: string;
  selectedModel: string;
  connectionState: ConnectionState;
};

export function PromptShortcutsSettings({
  selectedBridgeId,
  selectedModel,
  connectionState,
}: PromptShortcutsSettingsProps) {
  const [shortcuts, setShortcuts] = useState<PromptShortcut[]>([]);
  const [formMode, setFormMode] = useState<"create" | "edit" | null>(null);
  const [editingShortcut, setEditingShortcut] = useState<PromptShortcut | null>(null);
  const [deletingShortcut, setDeletingShortcut] = useState<PromptShortcut | null>(null);
  const [formBusy, setFormBusy] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [loadError, setLoadError] = useState("");

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

  const canGenerate =
    connectionState === "connected" && Boolean(selectedBridgeId) && Boolean(selectedModel);

  const openCreate = () => {
    setEditingShortcut(null);
    setFormMode("create");
  };

  const openEdit = (shortcut: PromptShortcut) => {
    setEditingShortcut(shortcut);
    setFormMode("edit");
  };

  const handleDelete = async () => {
    if (!deletingShortcut) return;
    setDeleteBusy(true);
    try {
      await deletePromptShortcut(deletingShortcut.id);
      setDeletingShortcut(null);
      await reload();
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Gagal menghapus prompt shortcut");
    } finally {
      setDeleteBusy(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between gap-3 pb-2">
        <p className="m-0 text-sm text-slate-500">
          Kelola template prompt yang tersedia di composer.
        </p>
        <Button type="button" variant="outline" size="sm" onClick={openCreate}>
          <PlusIcon className="size-3.5" />
          Buat template
        </Button>
      </div>

      {loadError && <p className="m-0 pb-2 text-sm text-red-400">{loadError}</p>}

      {shortcuts.length === 0 ? (
        <p className="m-0 py-6 text-center text-sm text-slate-500">Belum ada prompt shortcut.</p>
      ) : (
        <div className="divide-y divide-white/8">
          {shortcuts.map((shortcut) => (
            <div
              key={shortcut.id}
              className="flex items-center justify-between gap-4 py-4"
            >
              <div className="min-w-0 flex-1">
                <div
                  className={cn("truncate text-sm font-medium", variantClasses[shortcut.variant])}
                >
                  {shortcut.icon ? `${shortcut.icon} ` : ""}
                  {shortcut.label}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Edit ${shortcut.label}`}
                  onClick={() => openEdit(shortcut)}
                >
                  <PencilIcon className="size-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="text-red-400 hover:text-red-300"
                  aria-label={`Hapus ${shortcut.label}`}
                  onClick={() => setDeletingShortcut(shortcut)}
                >
                  <Trash2Icon className="size-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <PromptShortcutFormModal
        mode={formMode === "edit" ? "edit" : "create"}
        shortcut={editingShortcut}
        open={formMode !== null}
        busy={formBusy}
        selectedBridgeId={selectedBridgeId}
        selectedModel={selectedModel}
        canGenerate={canGenerate}
        onClose={() => setFormMode(null)}
        onSaved={() => void reload()}
        onBusyChange={setFormBusy}
      />

      <DeletePromptShortcutModal
        shortcut={deletingShortcut}
        busy={deleteBusy}
        onClose={() => setDeletingShortcut(null)}
        onConfirm={() => void handleDelete()}
      />
    </>
  );
}
