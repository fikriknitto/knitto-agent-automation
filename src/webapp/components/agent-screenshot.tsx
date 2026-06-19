import { useEffect, useState } from "react";

type AgentScreenshotProps = {
  base64: string;
};

/** Render PNG via object URL — avoids browser data-URL length limits on large screenshots. */
export function AgentScreenshot({ base64 }: AgentScreenshotProps) {
  const [src, setSrc] = useState<string | undefined>();

  useEffect(() => {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const url = URL.createObjectURL(new Blob([bytes], { type: "image/png" }));
    setSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [base64]);

  if (!src) return null;

  return <img className="agent-screenshot" src={src} alt="Screenshot" />;
}
