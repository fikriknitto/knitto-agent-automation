import { useMemo } from "react";

import { cn } from "@/lib/cn";
import type { BridgeSummary, ConnectionState } from "@/lib/types";
import {
    Combobox,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxInput,
    ComboboxItem,
    ComboboxList,
} from "./ui/combobox";

type ComboboxOption = { value: string; label: string };

const pillComboboxClass =
  "h-6! min-w-0 rounded-2xl! border-white/10 bg-white/8 text-xs text-slate-300 shadow-none has-[[data-slot=input-group-control]:focus-visible]:border-white/15 has-[[data-slot=input-group-control]:focus-visible]:ring-1 has-[[data-slot=input-group-control]:focus-visible]:ring-white/10 dark:bg-white/8 [&_input]:h-7 [&_input]:min-w-0 [&_input]:border-0 [&_input]:bg-transparent [&_input]:px-2.5 [&_input]:text-xs [&_input]:shadow-none";

type PillComboboxProps = {
  ariaLabel: string;
  placeholder: string;
  items: ComboboxOption[];
  value: ComboboxOption | null;
  disabled?: boolean;
  className?: string;
  emptyText: string;
  onValueChange: (value: string) => void;
};

function PillCombobox({
  ariaLabel,
  placeholder,
  items,
  value,
  disabled,
  className,
  emptyText,
  onValueChange,
}: PillComboboxProps) {
  return (
    <Combobox
      items={items}
      value={value}
      disabled={disabled}
      isItemEqualToValue={(a, b) => a.value === b.value}
      onValueChange={(item) => onValueChange(item?.value ?? "")}
    >
      <ComboboxInput
        aria-label={ariaLabel}
        placeholder={placeholder}
        disabled={disabled}
        showClear={false}
        className={cn(pillComboboxClass, className)}
      />
      <ComboboxContent>
        <ComboboxEmpty>{emptyText}</ComboboxEmpty>
        <ComboboxList>
          {(item: ComboboxOption) => (
            <ComboboxItem key={item.value} value={item}>
              {item.label}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

type BridgeAndModelProps = {
  connectionState: ConnectionState;
  bridges: BridgeSummary[];
  selectedBridgeId: string;
  selectedModel: string;
  disabled?: boolean;
  onSelectBridge: (id: string) => void;
  onSelectModel: (id: string) => void;
};

export function resolveModelForBridge(
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

export function BridgeAndModel({
  connectionState,
  bridges,
  selectedBridgeId,
  selectedModel,
  disabled,
  onSelectBridge,
  onSelectModel,
}: BridgeAndModelProps) {
  const bridge = bridges.find((b) => b.bridgeId === selectedBridgeId);
  const model = resolveModelForBridge(bridge, selectedModel);
  const models = bridge?.models ?? [];

  const bridgeItems = useMemo(
    () => bridges.map((b) => ({ value: b.bridgeId, label: b.bridgeLabel })),
    [bridges]
  );

  const modelItems = useMemo(
    () => models.map((m) => ({ value: m.id, label: m.label })),
    [models]
  );

  const selectedBridgeItem = useMemo(
    () => bridgeItems.find((item) => item.value === selectedBridgeId) ?? null,
    [bridgeItems, selectedBridgeId]
  );

  const selectedModelItem = useMemo(
    () => modelItems.find((item) => item.value === model) ?? null,
    [modelItems, model]
  );

  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <PillCombobox
        ariaLabel="Bridge"
        placeholder="Bridge"
        items={bridgeItems}
        value={selectedBridgeItem}
        disabled={disabled || connectionState !== "connected"}
        className="max-w-36"
        emptyText="Bridge tidak ditemukan."
        onValueChange={onSelectBridge}
      />
      <PillCombobox
        key={selectedBridgeId || "no-bridge"}
        ariaLabel="Model"
        placeholder="Model"
        items={modelItems}
        value={selectedModelItem}
        disabled={disabled || !models.length || connectionState !== "connected"}
        className="max-w-32"
        emptyText="Model tidak ditemukan."
        onValueChange={onSelectModel}
      />
    </div>
  );
}
