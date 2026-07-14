import type { AutomationPlatform, BridgeJob, MobileConfig, TestCaseSpec } from "@knitto/shared";
import {
  MAX_TEST_CASES,
  parseTestCasesFromPrompt,
  validateHybridPrompt,
} from "@knitto/shared";
import { loadShortcutRegistry } from "./test-case-shortcut-resolver.js";

export type ResolvedTestCases = {
  testCases: TestCaseSpec[];
  errors: string[];
  isMultiTest: boolean;
};

function resolveParsedJobTestCases(
  job: BridgeJob,
  parsed: { testCases: TestCaseSpec[]; errors: string[] }
): ResolvedTestCases {
  const platform = job.platform ?? "browser";
  const isMultiTest = platform === "hybrid" || parsed.testCases.length > 1;

  if (platform === "hybrid" && parsed.errors.length) {
    return { testCases: [], errors: parsed.errors, isMultiTest: true };
  }

  if (platform === "hybrid" && parsed.testCases.length === 0) {
    return {
      testCases: [],
      errors: ["Prompt hybrid membutuhkan minimal satu heading ## Test Case."],
      isMultiTest: true,
    };
  }

  return {
    testCases: parsed.testCases,
    errors: parsed.errors,
    isMultiTest,
  };
}

export async function resolveJobTestCasesAsync(job: BridgeJob): Promise<ResolvedTestCases> {
  if (job.testCases?.length) {
    return {
      testCases: job.testCases.slice(0, MAX_TEST_CASES),
      errors: [],
      isMultiTest: job.testCases.length > 1 || job.platform === "hybrid",
    };
  }

  const registry = await loadShortcutRegistry();
  const platform = job.platform ?? "browser";
  const parsed =
    platform === "hybrid"
      ? validateHybridPrompt(job.text, job.mobileConfig, registry)
      : parseTestCasesFromPrompt(job.text, job.mobileConfig, registry);

  return resolveParsedJobTestCases(job, parsed);
}

/** @deprecated Use resolveJobTestCasesAsync — sync path without shortcut registry. */
export function resolveJobTestCases(job: BridgeJob): ResolvedTestCases {
  if (job.testCases?.length) {
    return {
      testCases: job.testCases.slice(0, MAX_TEST_CASES),
      errors: [],
      isMultiTest: job.testCases.length > 1 || job.platform === "hybrid",
    };
  }

  const platform = job.platform ?? "browser";
  const parsed =
    platform === "hybrid"
      ? validateHybridPrompt(job.text, job.mobileConfig, [])
      : parseTestCasesFromPrompt(job.text, job.mobileConfig, []);

  return resolveParsedJobTestCases(job, parsed);
}

export function shouldUseOrchestrator(
  platform: AutomationPlatform | undefined,
  testCases: TestCaseSpec[]
): boolean {
  if (platform === "hybrid") return testCases.length > 0;
  return testCases.length > 1;
}

export function mobileConfigForTestCase(
  tc: TestCaseSpec,
  fallback?: MobileConfig
): MobileConfig | undefined {
  if (tc.platform !== "mobile") return undefined;
  const appPackage = tc.appPackage ?? fallback?.appPackage;
  if (!appPackage?.trim()) return undefined;
  return {
    appPackage: appPackage.trim(),
    appActivity: fallback?.appActivity,
    udid: tc.udid ?? fallback?.udid,
    deepLink: tc.deepLink ?? fallback?.deepLink,
  };
}

/**
 * Hybrid job: device always Auto (pool). Package diambil dari TC mobile pertama
 * (App: / shortcut), bukan dari pilihan composer.
 */
export function resolveHybridMobileConfig(
  testCases: TestCaseSpec[],
  fallback?: MobileConfig
): MobileConfig | undefined {
  const mobileTc = testCases.find((tc) => tc.platform === "mobile");
  if (!mobileTc) return undefined;
  const appPackage =
    mobileTc.appPackage?.trim() || fallback?.appPackage?.trim() || "";
  if (!appPackage) return undefined;
  return {
    appPackage,
    udid: undefined,
    deepLink: mobileTc.deepLink?.trim() || fallback?.deepLink?.trim() || undefined,
  };
}

export async function validateJobTestCasesForQueueAsync(
  platform: AutomationPlatform | undefined,
  text: string,
  mobileConfig?: MobileConfig
): Promise<string | null> {
  if (platform !== "hybrid") return null;
  const registry = await loadShortcutRegistry();
  const result = validateHybridPrompt(text, mobileConfig, registry);
  if (result.errors.length) return result.errors.join(" ");
  if (!result.testCases.length) {
    return "Prompt hybrid membutuhkan minimal satu heading ## Test Case.";
  }
  return null;
}

export function validateJobTestCasesForQueue(
  platform: AutomationPlatform | undefined,
  text: string,
  mobileConfig?: MobileConfig
): string | null {
  if (platform !== "hybrid") return null;
  const result = validateHybridPrompt(text, mobileConfig, []);
  if (result.errors.length) return result.errors.join(" ");
  if (!result.testCases.length) {
    return "Prompt hybrid membutuhkan minimal satu heading ## Test Case.";
  }
  return null;
}
