import { HELP_TEXT, parseLaunchOptions } from "./config.js";
import { startBlueStacksInstances } from "./launcher.js";

export async function runStartInstanceCli(argv = process.argv.slice(2)): Promise<void> {
  const args = argv[0] === "--" ? argv.slice(1) : argv;

  if (args.includes("--help") || args.includes("-h")) {
    console.log(HELP_TEXT);
    return;
  }

  const options = parseLaunchOptions(args);
  await startBlueStacksInstances(options);
}
