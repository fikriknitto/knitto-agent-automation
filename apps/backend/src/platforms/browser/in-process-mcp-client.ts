import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import {
  createInProcessClient,
  type AnyToolDefinition,
} from "../mcp-kit/in-process-client.js";
import {
  automation_get_app_memory,
  automation_update_app_memory,
  automation_navigate,
  automation_get_page_snapshot,
  automation_click,
  automation_click_at,
  automation_fill,
  automation_assert_text,
  automation_assert_visible,
  automation_take_screenshot,
  automation_scroll,
  automation_press_key,
  automation_hover,
  automation_select_option,
  automation_wait_for,
  automation_go_back,
  automation_go_forward,
  automation_upload_file,
  automation_close_browser,
  automation_stop_test_case_segment,
} from "./registry.js";

/** Browser MCP tools — names are `browser_*` (W6 cutover). */
const ALL_TOOLS = [
  automation_get_app_memory,
  automation_update_app_memory,
  automation_navigate,
  automation_get_page_snapshot,
  automation_click,
  automation_click_at,
  automation_fill,
  automation_assert_text,
  automation_assert_visible,
  automation_take_screenshot,
  automation_scroll,
  automation_press_key,
  automation_hover,
  automation_select_option,
  automation_wait_for,
  automation_go_back,
  automation_go_forward,
  automation_upload_file,
  automation_close_browser,
  automation_stop_test_case_segment,
] as const;

export function createInProcessMcpClient(): Client {
  return createInProcessClient(ALL_TOOLS as unknown as readonly AnyToolDefinition[]);
}

export { ALL_TOOLS };
