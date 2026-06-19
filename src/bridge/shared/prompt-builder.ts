import {
    AUTOMATION_PROMPT_STRATEGIES,
    type AutomationStrategyKey,
} from "../../mcp/libs/prompts/texts.js";
import type { PromptImage } from "./types.js";

export interface AgentPromptInput {
  text: string;
  images?: PromptImage[];
}

export type AgentRunInput =
  | string
  | Array<{
      role: "user";
      content: Array<
        | { type: "text"; text: string }
        | { type: "file"; data: string; mediaType: string; filename?: string }
      >;
    }>;

export function buildAgentPrompt(args: {
  channel: string;
  text: string;
  strategy?: string;
  images?: PromptImage[];
}): AgentPromptInput {
  const strategyKey = args.strategy as AutomationStrategyKey | undefined;
  const hasImages = Boolean(args.images?.length);
  const strategyBody =
    strategyKey && strategyKey in AUTOMATION_PROMPT_STRATEGIES
      ? AUTOMATION_PROMPT_STRATEGIES[strategyKey].body
      : AUTOMATION_PROMPT_STRATEGIES.automation_e2e_strategy.body;

  const userText = args.text.trim();

  const text = `You are a web automation tester. Use only MCP tools with the automation_ prefix.

Channel (for logging): ${args.channel}

Strategy:
${strategyBody}
${hasImages ? "\nA reference screenshot is attached. Use it together with snapshot tools when deciding what to click.\n" : ""}
Behave like a human tester:
- Observe the page (automation_get_page_snapshot; elements include bbox, inViewport, disabled; div>svg menu icons appear as role=button)
- Call automation_take_screenshot when the snapshot is ambiguous or you need visual confirmation
- Scroll to reveal off-screen content (automation_scroll)
- Wait for dynamic loads (automation_wait_for with network_idle or locator)
- Use automation_hover before dropdowns/menus; automation_press_key (Enter/Tab/Escape) for forms and closing overlays
- automation_select_option for native selects and comboboxes
- automation_go_back / automation_go_forward for history navigation
- Verify with automation_assert_text / automation_assert_visible
- Persist learnings via automation_get_app_memory / automation_update_app_memory

Header / hamburger menu workflow (div wrapping SVG is detected in snapshot as role=button, often name "Menu" or "Icon button"):
1. automation_get_page_snapshot — find menu trigger (role=button, aria-expanded, div+svg in header, name contains Menu)
2. automation_take_screenshot if trigger is unclear
3. automation_click with ref + clickCenter:true on the hamburger/menu trigger (or automation_hover then click)
4. automation_wait_for type=locator until a menuitem/link appears, or network_idle
5. automation_get_page_snapshot again — menu items are visible only after open
6. automation_click the target menuitem/link
7. If snapshot has no ref but screenshot shows the icon: use automation_click_at at estimated viewport x,y (last resort)

User request:
${userText}

Workflow:
1. automation_get_app_memory — read app knowledge when appId is known or infer from URL
2. automation_navigate — open the target URL
3. automation_get_page_snapshot — discover UI; prefer inViewport refs; no data-testid
4. automation_scroll / automation_hover / automation_click / automation_click_at / automation_fill / automation_press_key
5. automation_wait_for — after navigation, menu open, or SPA actions
6. automation_assert_text / automation_assert_visible — validate
7. automation_take_screenshot — capture evidence (vision models receive PNG in tool result)
8. automation_update_app_memory — persist menu trigger refs and navigation patterns

Summarize results in plain language when done.`;

  return { text, images: args.images };
}

type UserContentPart =
  | { type: "text"; text: string }
  | { type: "file"; data: string; mediaType: string; filename?: string };

export function buildAgentRunInput(prompt: AgentPromptInput): AgentRunInput {
  if (!prompt.images?.length) {
    return prompt.text;
  }

  const content: UserContentPart[] = [{ type: "text", text: prompt.text }];

  for (const image of prompt.images) {
    content.push({
      type: "file",
      data: image.data,
      mediaType: image.mimeType,
      ...(image.name ? { filename: image.name } : {}),
    });
  }

  return [{ role: "user", content }];
}

export function buildCursorSdkMessage(
  prompt: AgentPromptInput
): string | { text: string; images: Array<{ data: string; mimeType: string }> } {
  if (!prompt.images?.length) {
    return prompt.text;
  }

  return {
    text: prompt.text,
    images: prompt.images.map((image) => ({
      data: image.data,
      mimeType: image.mimeType,
    })),
  };
}

type GeminiPart =
  | { text: string }
  | { inlineData: { mimeType: string; data: string } };

export function buildGeminiContents(
  prompt: AgentPromptInput
): string | Array<{ role: "user"; parts: GeminiPart[] }> {
  if (!prompt.images?.length) {
    return prompt.text;
  }

  const parts: GeminiPart[] = [{ text: prompt.text }];
  for (const image of prompt.images) {
    parts.push({
      inlineData: {
        mimeType: image.mimeType,
        data: image.data,
      },
    });
  }

  return [{ role: "user", parts }];
}

type OpenAIContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

export function buildOpenAIUserContent(
  prompt: AgentPromptInput
): string | OpenAIContentPart[] {
  if (!prompt.images?.length) {
    return prompt.text;
  }

  const content: OpenAIContentPart[] = [{ type: "text", text: prompt.text }];
  for (const image of prompt.images) {
    content.push({
      type: "image_url",
      image_url: { url: `data:${image.mimeType};base64,${image.data}` },
    });
  }
  return content;
}
