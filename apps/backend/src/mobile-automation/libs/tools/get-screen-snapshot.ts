import { defineTool, ToolError } from "../../../automation/core/index.js";
import { captureScreenSnapshot } from "../driver/snapshot.js";
import { getDriver } from "../driver/session.js";
import {
  getScreenSnapshotInputSchema,
  getScreenSnapshotOutputShape,
} from "../schema.js";

export const mobile_get_screen_snapshot = defineTool({
  name: "mobile_get_screen_snapshot",
  description:
    "Get semantic UI tree with refs (e1, e2, …) for the current Android screen. Call before tap/fill.",
  inputSchema: getScreenSnapshotInputSchema,
  outputSchema: getScreenSnapshotOutputShape,
  handler: async (args) => {
    try {
      const driver = await getDriver();
      return await captureScreenSnapshot(driver, {
        interactiveOnly: args.interactiveOnly,
        maxElements: args.maxElements,
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      throw new ToolError(`Failed to get screen snapshot: ${msg}`);
    }
  },
});
