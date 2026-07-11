const SECTION_HEADING_RE = /^##\s+\[([^\]]+)\]\s*$/gm;

export function normalizeSectionKey(sectionKey: string): string {
  return sectionKey
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function parseMemorySections(content: string): Map<string, string> {
  const sections = new Map<string, string>();
  const normalized = content.replace(/\r\n/g, "\n");
  const headingMatches: { key: string; bodyStart: number }[] = [];

  let match: RegExpExecArray | null;
  SECTION_HEADING_RE.lastIndex = 0;
  while ((match = SECTION_HEADING_RE.exec(normalized)) !== null) {
    const key = normalizeSectionKey(match[1] ?? "");
    if (!key) continue;
    headingMatches.push({ key, bodyStart: match.index + match[0].length });
  }

  for (let i = 0; i < headingMatches.length; i++) {
    const current = headingMatches[i]!;
    const sliceStart = current.bodyStart;
    const nextHeading = normalized.indexOf("\n## [", sliceStart);
    const sliceEnd = nextHeading >= 0 ? nextHeading : normalized.length;
    const body = normalized.slice(sliceStart, sliceEnd).trim();
    if (!sections.has(current.key)) {
      sections.set(current.key, body);
    }
  }

  return sections;
}

function splitPreambleAndSections(content: string): { preamble: string; sections: Map<string, string> } {
  const normalized = content.replace(/\r\n/g, "\n");
  const firstSection = normalized.search(/^##\s+\[/m);
  const preamble =
    firstSection > 0 ? normalized.slice(0, firstSection).trim() : firstSection === -1 ? normalized.trim() : "";
  const sectionsPart = firstSection >= 0 ? normalized.slice(firstSection) : "";
  return { preamble, sections: parseMemorySections(sectionsPart) };
}

export function upsertMemorySection(
  existingContent: string,
  sectionKey: string,
  sectionBody: string
): string {
  const key = normalizeSectionKey(sectionKey);
  if (!key) {
    throw new Error("sectionKey tidak valid");
  }

  const { preamble, sections } = splitPreambleAndSections(existingContent);
  sections.set(key, sectionBody.trim());

  const sectionBlocks = [...sections.entries()].map(
    ([k, body]) => `## [${k}]\n\n${body.trim()}\n`
  );

  const parts: string[] = [];
  if (preamble) parts.push(preamble);
  parts.push(...sectionBlocks);

  return `${parts.join("\n\n").trim()}\n`;
}
