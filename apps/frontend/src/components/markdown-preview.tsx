import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import { AgentScreenshot } from "./agent-screenshot";

type MarkdownPreviewProps = {
  text: string;
  screenshotBase64?: string;
};

const markdownComponents: Components = {
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noreferrer noopener">
      {children}
    </a>
  ),
};

export function MarkdownPreview({ text, screenshotBase64 }: MarkdownPreviewProps) {
  const hasText = Boolean(text.trim());
  const hasScreenshot = Boolean(screenshotBase64);

  if (!hasText && !hasScreenshot) return null;

  return (
    <div className="chat-markdown">
      {hasText && <ReactMarkdown components={markdownComponents}>{text}</ReactMarkdown>}
      {hasScreenshot && <AgentScreenshot base64={screenshotBase64!} />}
    </div>
  );
}
