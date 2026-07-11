import type { Editor } from "@tiptap/react";
import type { EditorProps } from "@tiptap/pm/view";

type MarkdownManager = {
  serialize?: (content: unknown) => string;
};

function getMarkdownManager(editor: Editor): MarkdownManager | undefined {
  const storage = editor.storage as { markdown?: MarkdownManager };
  if (storage.markdown?.serialize) return storage.markdown;
  const editorMarkdown = (editor as Editor & { markdown?: MarkdownManager }).markdown;
  return editorMarkdown;
}

function serializeSelectionMarkdown(editor: Editor): string {
  const { from, to, empty } = editor.state.selection;
  if (empty) return editor.getMarkdown();

  const docSize = editor.state.doc.content.size;
  if (from <= 1 && to >= docSize - 1) {
    return editor.getMarkdown();
  }

  const manager = getMarkdownManager(editor);
  if (manager?.serialize) {
    try {
      const fragment = editor.state.doc.cut(from, to);
      return manager.serialize(fragment.toJSON());
    } catch {
      // fall through to plain text
    }
  }

  return editor.state.doc.textBetween(from, to, "\n\n");
}

function clipboardHasImage(event: ClipboardEvent): boolean {
  const items = event.clipboardData?.items;
  if (!items?.length) return false;
  for (const item of items) {
    if (item.kind === "file" && item.type.startsWith("image/")) return true;
  }
  return false;
}

export function createMarkdownClipboardEditorProps(
  getEditor: () => Editor | null
): Pick<EditorProps, "handleDOMEvents" | "handlePaste"> {
  return {
    handleDOMEvents: {
      copy: (_view, event) => {
        const editor = getEditor();
        if (!editor || !event.clipboardData) return false;

        const { empty } = editor.state.selection;
        if (empty) return false;

        const markdown = serializeSelectionMarkdown(editor);
        event.preventDefault();
        event.clipboardData.setData("text/plain", markdown);
        return true;
      },
    },
    handlePaste: (_view, event) => {
      const editor = getEditor();
      if (!editor || !event.clipboardData) return false;
      if (clipboardHasImage(event)) return false;

      const text = event.clipboardData.getData("text/plain");
      if (!text) return false;

      event.preventDefault();
      editor.commands.insertContent(text, { contentType: "markdown" });
      return true;
    },
  };
}
