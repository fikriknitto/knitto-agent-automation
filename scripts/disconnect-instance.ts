import { disconnectBlueStacksAdb } from "./bluestacks/adb-disconnect-instances.js";
import { DISCONNECT_HELP_TEXT, parseConnectOptions } from "./bluestacks/config.js";

export async function runDisconnectInstanceCli(argv = process.argv.slice(2)): Promise<void> {
  const args = argv[0] === "--" ? argv.slice(1) : argv;

  if (args.includes("--help") || args.includes("-h")) {
    console.log(DISCONNECT_HELP_TEXT);
    return;
  }

  const options = parseConnectOptions(args);
  await disconnectBlueStacksAdb(options);
}

runDisconnectInstanceCli().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Error: ${message}`);
  process.exitCode = 1;
});
