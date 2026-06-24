import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import { AgentScreenshots } from "./agent-screenshot";

type MarkdownPreviewProps = {
  text: string;
  screenshots?: string[];
};

const markdownComponents: Components = {
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noreferrer noopener">
      {children}
    </a>
  ),
};

export function MarkdownPreview({ text, screenshots = [] }: MarkdownPreviewProps) {
  const hasText = Boolean(text.trim());
  const hasScreenshots = screenshots.length > 0;

  if (!hasText && !hasScreenshots) return null;

  return (
    <div className="chat-markdown">
      {hasText && <ReactMarkdown components={markdownComponents}>{text}</ReactMarkdown>}
      {hasScreenshots && <AgentScreenshots urls={screenshots} />}
    </div>
  );
}
