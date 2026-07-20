import { defineTool, ToolError } from "../../../platforms/mcp-kit/core/index.js";
import { uploadFileToInput } from "../driver/interactions.js";
import { uploadFileInputSchema, uploadFileOutputShape } from "../schema.js";

export const mobile_upload_file = defineTool({
  name: "mobile_upload_file",
  description:
    "Upload a file to a mobile file input. Uses adb push to device then sets path on the input element.",
  inputSchema: uploadFileInputSchema,
  outputSchema: uploadFileOutputShape,
  handler: async (args) => {
    try {
      return await uploadFileToInput({
        locator: args.locator,
        filePath: args.filePath,
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      throw new ToolError(`Failed to upload file: ${msg}`);
    }
  },
});
