#!/usr/bin/env node
import { setAutomationJobId } from "../../core/job-context.js";
import { logger } from "../mcp-kit/core/index.js";
import {
  runMcpStdioServer,
  reportFatalAndExit,
  type McpStdioConfig,
} from "../mcp-kit/stdio-server.js";
import { createSession, closeSession } from "./driver/session.js";
import mobileConfig from "./config.js";
import { setMobileJobConfig } from "./session/mobile-job-context.js";
import { ALL_TOOLS } from "./in-process-mcp-client.js";

async function prepareMobileJob(): Promise<void> {
  const jobId = process.env.MOBILE_JOB_ID?.trim() ?? process.env.AUTOMATION_JOB_ID?.trim();
  if (!jobId) return;
  setAutomationJobId(jobId);
  const appPackage = process.env.MOBILE_JOB_APP_PACKAGE?.trim();
  if (!appPackage) return;
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
    logger.info(`MCP stdio: skip early createSession (FORCE_CLOSE cleanup, job=${jobId})`);
  }
}

runMcpStdioServer({
  name: "Knitto Mobile Automation MCP",
  version: "1.0.0",
  platform: "mobile",
  tools: ALL_TOOLS as unknown as McpStdioConfig["tools"],
  beforeStart: prepareMobileJob,
  onShutdown: async () => {
    await closeSession();
  },
}).catch(reportFatalAndExit);
