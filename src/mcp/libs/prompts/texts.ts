export const AUTOMATION_PROMPT_STRATEGIES = {
  automation_e2e_strategy: {
    label: "E2E test",
    body: `Execute an end-to-end web test like a human: navigate, snapshot (prefer inViewport refs), scroll when needed, wait for SPA loads, interact via semantic locators, assert outcomes, screenshot for evidence, update memory.`,
  },
  automation_explore_strategy: {
    label: "Explore site",
    body: `Explore the site structure: snapshot pages, scroll to discover content, note navigation patterns and key locators, take screenshots of important views, update app memory without destructive actions.`,
  },
  automation_human_strategy: {
    label: "Human-like browse",
    body: `Browse the site like a real user: observe snapshot + screenshot when unsure, scroll naturally, hover menus, use keyboard (Enter/Tab/Escape), wait for dynamic content, verify visually and with assertions, save learnings to app memory. For header/hamburger menus: open the menu trigger first, re-snapshot, then click the menu item.`,
  },
} as const;

export type AutomationStrategyKey = keyof typeof AUTOMATION_PROMPT_STRATEGIES;
