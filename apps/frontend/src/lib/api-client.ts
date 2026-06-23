const WS_PATH = "/ws";

/** Connect via same origin (Vite proxies /ws → backend). */
export function resolveWsUrl(_host: string, _port: string): string {
  if (typeof window !== "undefined") {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${window.location.host}${WS_PATH}`;
  }
  const host = _host.trim() || "localhost";
  const port = _port.trim() || "3080";
  return `ws://${host}:${port}${WS_PATH}`;
}
