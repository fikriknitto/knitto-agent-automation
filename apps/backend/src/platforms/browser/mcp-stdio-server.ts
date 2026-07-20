#!/usr/bin/env node
import {
  runMcpStdioServer,
  reportFatalAndExit,
  type McpStdioConfig,
} from "../mcp-kit/stdio-server.js";
import { ALL_TOOLS } from "./in-process-mcp-client.js";

runMcpStdioServer({
  name: "Knitto Automation MCP",
  version: "1.0.0",
  platform: "browser",
  tools: ALL_TOOLS as unknown as McpStdioConfig["tools"],
}).catch(reportFatalAndExit);
