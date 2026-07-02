import { useEffect, useRef, useState } from "react";
import {
  getMobileDevicesStreamUrl,
  type MobileDevice,
  type MobileDevicesStreamPayload,
} from "@/lib/api/mobile-device-api";

export function useMobileDevicesStream(enabled: boolean) {
  const [devices, setDevices] = useState<MobileDevice[]>([]);
  const [connected, setConnected] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const sourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!enabled) {
      sourceRef.current?.close();
      sourceRef.current = null;
      setConnected(false);
      return;
    }

    const url = getMobileDevicesStreamUrl();
    const source = new EventSource(url);
    sourceRef.current = source;

    source.onopen = () => {
      setConnected(true);
      setError(null);
    };

    source.onmessage = (event) => {
      try {
        const payload = JSON.parse(String(event.data)) as MobileDevicesStreamPayload;
        setDevices(payload.devices);
        setLastUpdatedAt(payload.at);
        setError(payload.error);
      } catch {
        // ignore malformed payloads
      }
    };

    source.onerror = () => {
      setConnected(false);
      setError("SSE connection error");
      source.close();
      sourceRef.current = null;
    };

    return () => {
      source.close();
      sourceRef.current = null;
      setConnected(false);
    };
  }, [enabled]);

  return { devices, connected, lastUpdatedAt, error };
}
