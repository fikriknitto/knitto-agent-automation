import { z } from "zod";
import {
  testCaseSpecSchema,
  testCaseStatusSchema,
  videoRecordingMetaSchema,
  type TestCaseSpec,
} from "./test-case.js";

export const bridgeKindSchema = z.enum(["cursor", "gemini", "openrouter", "ninerouter"]);
export type BridgeKind = z.infer<typeof bridgeKindSchema>;

export const agentJobStatusSchema = z.enum([
  "queued",
  "running",
  "completed",
  "error",
  "cancelled",
]);
export type AgentJobStatus = z.infer<typeof agentJobStatusSchema>;

export const bridgeModelOptionSchema = z.object({
  id: z.string(),
  label: z.string(),
  vision: z.boolean().optional(),
});

export const promptAttachmentSchema = z.object({
  storagePath: z.string().min(1),
  mimeType: z.string(),
  name: z.string(),
  kind: z.enum(["image", "file"]),
});

export type PromptAttachment = z.infer<typeof promptAttachmentSchema>;

export const automationPlatformSchema = z.enum(["browser", "mobile", "hybrid"]);
export type AutomationPlatform = z.infer<typeof automationPlatformSchema>;

export const mobileConfigSchema = z.object({
  appPackage: z.string().min(1),
  appActivity: z.string().optional(),
  udid: z.string().optional(),
  deepLink: z.string().optional(),
});
export type MobileConfig = z.infer<typeof mobileConfigSchema>;

export const userPromptMessageSchema = z.object({
  type: z.literal("user_prompt"),
  id: z.string(),
  channel: z.string(),
  connectionId: z.string().optional(),
  bridgeId: z.string(),
  text: z.string(),
  strategy: z.string().optional(),
  model: z.string().optional(),
  attachments: z.array(promptAttachmentSchema).optional(),
  promptBasePaths: z.array(z.string().min(1)).optional(),
  mainPrompt: z.string().optional(),
  platform: automationPlatformSchema.optional(),
  mobileConfig: mobileConfigSchema.optional(),
  testCases: z.array(testCaseSpecSchema).optional(),
});

export const agentJobCancelMessageSchema = z.object({
  type: z.literal("agent_job_cancel"),
  id: z.string(),
  channel: z.string(),
  connectionId: z.string().optional(),
  bridgeId: z.string(),
});

export { videoRecordingMetaSchema, type VideoRecordingMeta } from "./test-case.js";

export const testCaseResultSchema = z.object({
  testCaseId: z.string(),
  title: z.string(),
  platform: z.enum(["browser", "mobile"]),
  status: testCaseStatusSchema,
  summary: z.string(),
  screenshots: z.array(z.string()).optional(),
  videoUrl: z.string().optional(),
  label: z.string().optional(),
});
export type TestCaseResult = z.infer<typeof testCaseResultSchema>;

export const agentJobMessageSchema = z.object({
  type: z.literal("agent_job"),
  id: z.string(),
  channel: z.string(),
  connectionId: z.string().optional(),
  bridgeId: z.string().optional(),
  status: agentJobStatusSchema,
  message: z.string(),
  progress: z.number().optional(),
  result: z.string().optional(),
  screenshotBase64: z.string().optional(),
  screenshots: z.array(z.string()).optional(),
  videoUrl: z.string().optional(),
  videoUrls: z.array(z.string()).optional(),
  videoRecordingMeta: z.array(videoRecordingMetaSchema).optional(),
  testCaseResults: z.array(testCaseResultSchema).optional(),
  testCaseIndex: z.number().optional(),
  testCaseTotal: z.number().optional(),
  testCaseId: z.string().optional(),
  testCasePlatform: z.enum(["browser", "mobile"]).optional(),
  testCaseStatus: z
    .enum(["pending", "running", "completed", "error", "skipped"])
    .optional(),
  testCases: z.array(testCaseSpecSchema).optional(),
  toolName: z.string().optional(),
  deviceUdid: z.string().optional(),
});

export type BridgeModelOption = z.infer<typeof bridgeModelOptionSchema>;
export type UserPromptMessage = z.infer<typeof userPromptMessageSchema>;
export type AgentJobCancelMessage = z.infer<typeof agentJobCancelMessageSchema>;
export type AgentJobMessage = z.infer<typeof agentJobMessageSchema>;

export interface BridgeJob {
  id: string;
  channel: string;
  connectionId?: string;
  text: string;
  strategy?: string;
  model?: string;
  attachments?: PromptAttachment[];
  promptBasePaths?: string[];
  mainPrompt?: string;
  platform?: AutomationPlatform;
  mobileConfig?: MobileConfig;
  testCases?: TestCaseSpec[];
}

export interface BridgeInfo {
  bridgeId: string;
  bridgeKind: BridgeKind;
  bridgeLabel: string;
  defaultModel: string;
  models: BridgeModelOption[];
  browserHeaded?: boolean;
}
