import { connectBlueStacksAdb } from "./bluestacks/adb-connect-instances.js";
import { CONNECT_HELP_TEXT, parseConnectOptions } from "./bluestacks/config.js";

export async function runConnectInstanceCli(argv = process.argv.slice(2)): Promise<void> {
  const args = argv[0] === "--" ? argv.slice(1) : argv;

  if (args.includes("--help") || args.includes("-h")) {
    console.log(CONNECT_HELP_TEXT);
    return;
  }

  const options = parseConnectOptions(args);
  await connectBlueStacksAdb(options);
}

runConnectInstanceCli().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Error: ${message}`);
  process.exitCode = 1;
});
