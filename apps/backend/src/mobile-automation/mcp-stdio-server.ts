#!/usr/bin/env node
import { setAutomationJobId } from "../automation/libs/job-context.js";
import { Server, logger } from "../automation/core/index.js";
import { setMobileJobConfig } from "./libs/mobile-job-context.js";
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
} from "./libs/registry.js";

async function main(): Promise<void> {
  const jobId = process.env.MOBILE_JOB_ID?.trim() ?? process.env.AUTOMATION_JOB_ID?.trim();
  if (jobId) {
    setAutomationJobId(jobId);
    const appPackage = process.env.MOBILE_JOB_APP_PACKAGE?.trim();
    if (appPackage) {
      setMobileJobConfig(jobId, {
        appPackage,
        appActivity: process.env.MOBILE_JOB_APP_ACTIVITY?.trim() || undefined,
        udid: process.env.MOBILE_JOB_UDID?.trim() || undefined,
        deepLink: process.env.MOBILE_JOB_DEEP_LINK?.trim() || undefined,
      });
    }
  }

  const server = new Server({
    name: "Knitto Mobile Automation MCP",
    version: "1.0.0",
  });

  server.registerTool(mobile_launch_app);
  server.registerTool(mobile_get_screen_snapshot);
  server.registerTool(mobile_tap);
  server.registerTool(mobile_tap_at);
  server.registerTool(mobile_scroll);
  server.registerTool(mobile_input_text);
  server.registerTool(mobile_take_screenshot);
  server.registerTool(mobile_upload_file);
  server.registerTool(mobile_get_app_memory);
  server.registerTool(mobile_update_app_memory);
  server.registerTool(mobile_press_key);
  server.registerTool(mobile_assert_visible);
  server.registerTool(mobile_wait_for);
  server.registerTool(mobile_close_app);
  server.registerTool(mobile_close_session);

  await server.start();
}

main().catch((err) => {
  logger.error(err instanceof Error ? err : String(err));
  process.exit(1);
});
