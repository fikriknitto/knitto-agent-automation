#!/usr/bin/env node
import { setAutomationJobId } from "../automation/libs/job-context.js";
import { Server, logger } from "../automation/core/index.js";
import { createSession, closeSession } from "./libs/driver/session.js";
import mobileConfig from "./libs/config.js";
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
  mobile_stop_test_case_segment,
} from "./libs/registry.js";
import { startSegmentStopPoller } from "../services/shared/segment-stop-poller.js";

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

      // Skip early session when multi-TC (segment managed) OR end-of-job cleanup
      // (FORCE_CLOSE). Cleanup used to clear MULTI_TC which triggered createSession
      // and relaunched the app after mobile_close_app.
      const forceClose =
        process.env.MOBILE_FORCE_CLOSE === "1" ||
        process.env.AUTOMATION_FORCE_CLOSE === "1";
      const multiTc = process.env.MOBILE_MULTI_TC === "1";
      if (mobileConfig.recordVideo && !multiTc && !forceClose) {
        try {
          await createSession();
          logger.info(`MCP stdio: recording started at job start (job=${jobId})`);
        } catch (error) {
          const msg = error instanceof Error ? error.message : String(error);
          logger.warn(`MCP stdio: early createSession failed: ${msg}`);
        }
      } else if (forceClose) {
        logger.info(
          `MCP stdio: skip early createSession (FORCE_CLOSE cleanup, job=${jobId})`
        );
      }
    }
  }

  const shutdown = async (): Promise<void> => {
    try {
      await closeSession();
    } catch {
      // best-effort — stopRecordingScreen + release device
    }
  };

  process.once("SIGINT", () => {
    void shutdown().finally(() => process.exit(0));
  });
  process.once("SIGTERM", () => {
    void shutdown().finally(() => process.exit(0));
  });

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
  server.registerTool(mobile_stop_test_case_segment);

  startSegmentStopPoller("mobile");

  await server.start();
}

main().catch((err) => {
  logger.error(err instanceof Error ? err : String(err));
  process.exit(1);
});
