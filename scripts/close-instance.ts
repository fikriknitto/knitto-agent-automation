import { closeBlueStacksInstances } from "./bluestacks/closer.js";
import { CLOSE_HELP_TEXT, parseCloseOptions } from "./bluestacks/config.js";

export async function runCloseInstanceCli(argv = process.argv.slice(2)): Promise<void> {
  const args = argv[0] === "--" ? argv.slice(1) : argv;

  if (args.includes("--help") || args.includes("-h")) {
    console.log(CLOSE_HELP_TEXT);
    return;
  }

  const options = parseCloseOptions(args);
  await closeBlueStacksInstances(options);
}

runCloseInstanceCli().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Error: ${message}`);
  process.exitCode = 1;
});
