type AgentScreenshotsProps = {
  urls: string[];
};

/** All job evidence screenshots served from /api/agent-screenshots/{jobId}/{file}.png */
export function AgentScreenshots({ urls }: AgentScreenshotsProps) {
  if (!urls.length) return null;

  return (
    <div className="agent-screenshots">
      {urls.map((src) => (
        <img
          key={src}
          className="agent-screenshot"
          src={src}
          alt="Screenshot bukti"
          loading="lazy"
        />
      ))}
    </div>
  );
}
