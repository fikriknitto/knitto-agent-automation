import { z } from "zod";
import {
  appIdSchema,
  getAppMemoryInputSchema,
  getAppMemoryOutputShape,
  updateAppMemoryInputSchema,
  updateAppMemoryOutputShape,
} from "../../automation/libs/schema.js";

export {
  appIdSchema,
  getAppMemoryInputSchema,
  getAppMemoryOutputShape,
  updateAppMemoryInputSchema,
  updateAppMemoryOutputShape,
};

export const mobileLocatorSchema = {
  ref: z.string().optional().describe('Snapshot ref, e.g. "e12"'),
  accessibilityId: z.string().optional().describe("content-desc / accessibility id"),
  text: z.string().optional().describe("Visible text (partial match)"),
  name: z.string().optional().describe("Resource id or name"),
} as const;

export const mobileLocatorObjectSchema = z.object(mobileLocatorSchema);

export const launchAppInputSchema = {} as const;

export const launchAppOutputShape = {
  package: z.string(),
  activity: z.string().optional(),
  udid: z.string(),
} as const;

export const getScreenSnapshotInputSchema = {
  interactiveOnly: z.boolean().optional().default(true),
  maxElements: z.number().int().min(1).max(500).optional().default(200),
} as const;

export const mobileSnapshotElementShape = {
  ref: z.string(),
  className: z.string().nullable(),
  text: z.string().nullable(),
  contentDesc: z.string().nullable(),
  resourceId: z.string().nullable(),
  clickable: z.boolean(),
  editable: z.boolean(),
  enabled: z.boolean(),
  bbox: z
    .object({
      x: z.number(),
      y: z.number(),
      width: z.number(),
      height: z.number(),
    })
    .nullable(),
} as const;

export const getScreenSnapshotOutputShape = {
  package: z.string().nullable(),
  activity: z.string().nullable(),
  udid: z.string().nullable(),
  elements: z.array(z.object(mobileSnapshotElementShape)),
} as const;

export const tapInputSchema = {
  locator: mobileLocatorObjectSchema,
  clickCenter: z.boolean().optional().default(true),
} as const;

export const tapAtInputSchema = {
  x: z.number(),
  y: z.number(),
} as const;

export const tapAtOutputShape = {
  success: z.boolean(),
  x: z.number(),
  y: z.number(),
} as const;

export const inputTextInputSchema = {
  locator: mobileLocatorObjectSchema,
  value: z.string(),
  clear: z.boolean().optional().default(true),
  hideKeyboard: z.boolean().optional().default(true),
} as const;

export const interactionOutputShape = {
  success: z.boolean(),
  locator: z.object(mobileLocatorSchema),
} as const;

export const scrollInputSchema = {
  direction: z.enum(["up", "down", "top", "bottom"]),
  amount: z
    .number()
    .int()
    .min(50)
    .max(5000)
    .optional()
    .describe("Approx scroll distance in px; converted to gesture percent for the scroll area."),
  locator: mobileLocatorObjectSchema.optional(),
} as const;

export const scrollOutputShape = {
  success: z.boolean(),
} as const;

export const takeScreenshotInputSchema = {
  path: z.string().optional().describe("Optional PNG filename under screenshoot/agents/{jobId}/"),
} as const;

export const takeScreenshotOutputShape = {
  path: z.string(),
  base64: z.string(),
  mimeType: z.literal("image/png"),
} as const;

export const uploadFileInputSchema = {
  locator: mobileLocatorObjectSchema,
  filePath: z.string().min(1).describe("Absolute path to file on disk"),
} as const;

export const uploadFileOutputShape = {
  success: z.boolean(),
  locator: z.object(mobileLocatorSchema),
  filePath: z.string(),
  fileName: z.string(),
  remotePath: z.string(),
} as const;

export const pressKeyInputSchema = {
  key: z.enum(["BACK", "HOME", "ENTER", "TAB", "DEL", "MENU"]),
} as const;

export const pressKeyOutputShape = {
  success: z.boolean(),
  key: z.string(),
} as const;

export const assertVisibleInputSchema = {
  locator: mobileLocatorObjectSchema,
} as const;

export const assertVisibleOutputShape = {
  success: z.boolean(),
  locator: z.object(mobileLocatorSchema),
  visible: z.boolean(),
} as const;

export const waitForInputSchema = {
  type: z.enum(["locator", "text", "timeout"]),
  text: z.string().optional(),
  locator: mobileLocatorObjectSchema.optional(),
  timeoutMs: z.number().int().min(500).max(60_000).optional(),
} as const;

export const waitForOutputShape = {
  success: z.boolean(),
  type: z.enum(["locator", "text", "timeout"]),
} as const;

export const closeSessionOutputShape = {
  closed: z.boolean(),
} as const;

export type MobileLocator = {
  ref?: string;
  accessibilityId?: string;
  text?: string;
  name?: string;
};
