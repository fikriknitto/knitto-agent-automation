#!/usr/bin/env node
import { Server, logger } from "./core/index.js";
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
} from "./libs/registry.js";
import { startSegmentStopPoller } from "../services/shared/segment-stop-poller.js";

async function main(): Promise<void> {
  const server = new Server({
    name: "Knitto Automation MCP",
    version: "1.0.0",
  });

  server.registerTool(automation_get_app_memory);
  server.registerTool(automation_update_app_memory);
  server.registerTool(automation_navigate);
  server.registerTool(automation_get_page_snapshot);
  server.registerTool(automation_click);
  server.registerTool(automation_click_at);
  server.registerTool(automation_fill);
  server.registerTool(automation_assert_text);
  server.registerTool(automation_assert_visible);
  server.registerTool(automation_take_screenshot);
  server.registerTool(automation_scroll);
  server.registerTool(automation_press_key);
  server.registerTool(automation_hover);
  server.registerTool(automation_select_option);
  server.registerTool(automation_wait_for);
  server.registerTool(automation_go_back);
  server.registerTool(automation_go_forward);
  server.registerTool(automation_upload_file);
  server.registerTool(automation_close_browser);
  server.registerTool(automation_stop_test_case_segment);

  startSegmentStopPoller("browser");

  await server.start();
}

main().catch((err) => {
  logger.error(err instanceof Error ? err : String(err));
  process.exit(1);
});
