import { defineTool } from "../../core/index.js";
import { closeBrowser } from "../browser/session.js";
import { closeBrowserOutputShape } from "../schema.js";

export const automation_close_browser = defineTool({
  name: "automation_close_browser",
  description: "Close the Puppeteer browser session and all open pages.",
  inputSchema: {},
  outputSchema: closeBrowserOutputShape,
  handler: async () => {
    await closeBrowser();
    return { closed: true };
  },
});
