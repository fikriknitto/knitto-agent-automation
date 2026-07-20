import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import {
  createInProcessClient,
  type AnyToolDefinition,
} from "../mcp-kit/in-process-client.js";
import {
  mobile_launch_app,
  mobile_get_screen_snapshot,
  mobile_tap,
  mobile_tap_at,
  mobile_scroll,
  mobile_input_text,
  mobile_take_screenshot,
  mobile_upload_file,
  mobile_get_app_memory,
  mobile_update_app_memory,
  mobile_press_key,
  mobile_assert_visible,
  mobile_wait_for,
  mobile_close_app,
  mobile_close_session,
  mobile_stop_test_case_segment,
} from "./registry.js";

const ALL_TOOLS = [
  mobile_launch_app,
  mobile_get_screen_snapshot,
  mobile_tap,
  mobile_tap_at,
  mobile_scroll,
  mobile_input_text,
  mobile_take_screenshot,
  mobile_upload_file,
  mobile_get_app_memory,
  mobile_update_app_memory,
  mobile_press_key,
  mobile_assert_visible,
  mobile_wait_for,
  mobile_close_app,
  mobile_close_session,
  mobile_stop_test_case_segment,
] as const;

export function createInProcessMobileMcpClient(): Client {
  return createInProcessClient(ALL_TOOLS as unknown as readonly AnyToolDefinition[]);
}

export { ALL_TOOLS };
