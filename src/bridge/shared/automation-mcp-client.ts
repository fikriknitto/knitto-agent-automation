import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { automationMcpEnv, automationMcpSpawnArgs } from "./automation-mcp-config.js";

export async function connectAutomationMcp(opts: {
  command: string;
  mcpPath: string;
}): Promise<Client> {
  const env = automationMcpEnv();
  const filtered = Object.fromEntries(Object.entries(env).filter(([, v]) => v));
  const spawn = automationMcpSpawnArgs(opts);
  const transport = new StdioClientTransport({
    command: spawn.command,
    args: spawn.args,
    env: filtered,
    stderr: "pipe",
  });
  const client = new Client({ name: "knitto-automation-bridge", version: "1.0.0" });
  await client.connect(transport);
  return client;
}
