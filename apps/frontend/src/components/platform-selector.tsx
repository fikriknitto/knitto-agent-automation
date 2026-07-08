import type { AutomationPlatform, MobileConfig } from "@knitto/shared";
import { useMemo } from "react";
import { cn } from "@/lib/cn";
import { useMobileDevices } from "@/contexts/mobile-devices-context";
import { useMobilePackages } from "@/hooks/mobile/use-mobile-packages";
import { Badge } from "./ui/badge";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "./ui/combobox";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

const AUTO_UDID = "";

type ComboboxOption = { value: string; label: string };

type PlatformSelectorProps = {
  platform: AutomationPlatform;
  mobileConfig: MobileConfig;
  disabled?: boolean;
  onPlatformChange: (platform: AutomationPlatform) => void;
  onMobileConfigChange: (config: MobileConfig) => void;
};

export function toMobileConfigPayload(config: MobileConfig): MobileConfig | undefined {
  if (!config.appPackage?.trim()) return undefined;
  const payload: MobileConfig = { appPackage: config.appPackage.trim() };
  if (config.udid?.trim()) payload.udid = config.udid.trim();
  if (config.deepLink?.trim()) payload.deepLink = config.deepLink.trim();
  return payload;
}

export function PlatformSelector({
  platform,
  mobileConfig,
  disabled,
  onPlatformChange,
  onMobileConfigChange,
}: PlatformSelectorProps) {
  const isMobile = platform === "mobile";
  const { devices, connected, error: streamError } = useMobileDevices();
  const packageUdid = mobileConfig.udid?.trim() || devices.find((d) => d.state === "idle")?.udid;
  const { data: packages = [], isLoading: packagesLoading } = useMobilePackages(packageUdid);

  const deviceItems = useMemo<ComboboxOption[]>(() => {
    const items: ComboboxOption[] = [{ value: AUTO_UDID, label: "Auto (pool)" }];
    for (const device of devices) {
      const status = device.state === "busy" ? "busy" : "idle";
      const label = device.model
        ? `${device.udid} — ${device.model} (${status})`
        : `${device.udid} (${status})`;
      items.push({ value: device.udid, label });
    }
    return items;
  }, [devices]);

  const packageItems = useMemo<ComboboxOption[]>(
    () => packages.map((p) => ({ value: p.package, label: p.package })),
    [packages]
  );

  const selectedDevice =
    deviceItems.find((item) => item.value === (mobileConfig.udid ?? AUTO_UDID)) ?? deviceItems[0] ?? null;

  const selectedPackage =
    packageItems.find((item) => item.value === mobileConfig.appPackage) ?? null;

  return (
    <div className="space-y-2 border-b border-white/8 pb-2">
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500">Platform</span>
        <div className="inline-flex rounded-full border border-white/10 bg-white/5 p-0.5">
          {(["browser", "mobile"] as const).map((value) => (
            <button
              key={value}
              type="button"
              disabled={disabled}
              className={cn(
                "rounded-full px-3 py-1 text-xs capitalize transition-colors",
                platform === value
                  ? "bg-white/15 text-slate-100"
                  : "text-slate-500 hover:text-slate-300"
              )}
              onClick={() => onPlatformChange(value)}
            >
              {value}
            </button>
          ))}
        </div>
        {isMobile && (
          <Badge variant="info" className="text-[10px]">
            {connected ? "SSE live" : "SSE offline"}
          </Badge>
        )}
      </div>

      {isMobile && (
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-xs text-slate-500">Device</Label>
            <Combobox
              items={deviceItems}
              value={selectedDevice}
              disabled={disabled}
              isItemEqualToValue={(a, b) => a.value === b.value}
              onValueChange={(item) => {
                onMobileConfigChange({
                  ...mobileConfig,
                  udid: item?.value ? item.value : undefined,
                });
              }}
            >
              <ComboboxInput
                aria-label="Pilih device"
                placeholder="Auto (pool)"
                disabled={disabled}
                showClear={false}
                className="h-8 rounded-lg border-white/10 bg-white/5 text-xs"
              />
              <ComboboxContent>
                <ComboboxEmpty>Tidak ada device</ComboboxEmpty>
                <ComboboxList>
                  {(item: ComboboxOption) => (
                    <ComboboxItem key={item.value || "auto"} value={item}>
                      {item.label}
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-slate-500">Package (wajib)</Label>
            <Combobox
              items={packageItems}
              value={selectedPackage}
              disabled={disabled || !packageUdid}
              isItemEqualToValue={(a, b) => a.value === b.value}
              onValueChange={(item) => {
                if (!item?.value) return;
                onMobileConfigChange({ ...mobileConfig, appPackage: item.value });
              }}
            >
              <ComboboxInput
                aria-label="Pilih package"
                placeholder={packagesLoading ? "Memuat…" : "com.example.app"}
                disabled={disabled || !packageUdid}
                showClear={false}
                className="h-8 rounded-lg border-white/10 bg-white/5 text-xs"
              />
              <ComboboxContent>
                <ComboboxEmpty>
                  {!packageUdid ? "Pilih device dulu" : "Package tidak ditemukan"}
                </ComboboxEmpty>
                <ComboboxList>
                  {(item: ComboboxOption) => (
                    <ComboboxItem key={item.value} value={item}>
                      {item.label}
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          </div>

          <div className="space-y-1 sm:col-span-2">
            <Label className="text-xs text-slate-500">Deep link (opsional)</Label>
            <Input
              value={mobileConfig.deepLink ?? ""}
              disabled={disabled}
              placeholder="myapp://path"
              className="h-8 border-white/10 bg-white/5 text-xs"
              onChange={(e) =>
                onMobileConfigChange({
                  ...mobileConfig,
                  deepLink: e.target.value || undefined,
                })
              }
            />
          </div>

          {streamError && (
            <p className="sm:col-span-2 text-xs text-amber-400">{streamError}</p>
          )}
          {devices.length === 0 && connected && (
            <p className="sm:col-span-2 text-xs text-amber-400">
              Tidak ada device Android — hubungkan emulator atau device USB.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
