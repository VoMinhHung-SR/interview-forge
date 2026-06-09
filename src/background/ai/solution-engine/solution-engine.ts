import { extractJsonFromResponse } from "@/background/ai/hint-engine/guardrails";
import type { AiCompletionRequest, AiProvider } from "@/background/ai/providers/types";
import type { AppLocale } from "@/shared/types";
import type {
  SolutionAnalysis,
  SolutionAnalysisJsonPayload,
  SolutionCode,
  SolutionEngineResult,
} from "@/shared/types/solution-analysis";
import {
  buildManualAnalysisPrompt,
  SOLUTION_JSON_SCHEMA,
  SOLUTION_SYSTEM_PROMPT,
} from "./prompts";

const MAX_RETRIES = 2;
const SOLUTION_TIMEOUT_MS = 90_000;

export interface SolutionEngineOptions {
  provider: AiProvider;
}

interface AnalyzeManualInput {
  problem: {
    title: string;
    description: string;
    examples: Array<{ input: string; output: string; explanation?: string }>;
    constraints?: string[];
  };
  solution: SolutionCode;
  problemId: string;
  codeHash: string;
  language?: AppLocale;
}

function normalizeLocale(value: string | undefined, fallback: AppLocale): AppLocale {
  return value?.toLowerCase().startsWith("vi") ? "vi" : fallback;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function isSolutionPayload(value: unknown): value is SolutionAnalysisJsonPayload {
  return typeof value === "object" && value !== null;
}

function normalizePayload(
  payload: SolutionAnalysisJsonPayload,
  meta: {
    problemId: string;
    codeHash: string;
    fallbackLocale: AppLocale;
    model: string;
  },
): SolutionAnalysis {
  return {
    language: normalizeLocale(payload.language, meta.fallbackLocale),
    pattern: payload.pattern?.trim() || "Unknown",
    timeComplexity: payload.timeComplexity?.trim() || "—",
    spaceComplexity: payload.spaceComplexity?.trim() || "—",
    bottlenecks: asStringArray(payload.bottlenecks),
    optimizations: asStringArray(payload.optimizations),
    missedEdgeCases: asStringArray(payload.missedEdgeCases),
    interviewFeedback: payload.interviewFeedback?.trim() || "",
    analysisMode: "manual",
    generatedAt: new Date().toISOString(),
    model: meta.model,
    codeHash: meta.codeHash,
    problemId: meta.problemId,
  };
}

function validatePayload(payload: SolutionAnalysisJsonPayload): string | null {
  if (!payload.pattern?.trim()) return "Missing pattern";
  if (!payload.timeComplexity?.trim()) return "Missing timeComplexity";
  if (!payload.spaceComplexity?.trim()) return "Missing spaceComplexity";
  if (!payload.interviewFeedback?.trim()) return "Missing interviewFeedback";
  return null;
}

export class SolutionAnalysisEngine {
  private provider: AiProvider;

  constructor(options: SolutionEngineOptions) {
    this.provider = options.provider;
  }

  async analyzeManual(input: AnalyzeManualInput): Promise<SolutionEngineResult> {
    const locale = input.language ?? "en";
    const { userPrompt } = buildManualAnalysisPrompt(
      input.problem,
      input.solution,
      locale,
    );

    let lastError = "Invalid AI response";

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      const retrySuffix =
        attempt > 0 ?
          `\n\nRETRY ${attempt}: Previous response was invalid (${lastError}). Return complete JSON only.`
        : "";

      const completion = await this.provider.complete({
        systemPrompt: SOLUTION_SYSTEM_PROMPT,
        userPrompt: `${userPrompt}${retrySuffix}\n\nSchema:\n${SOLUTION_JSON_SCHEMA}`,
        temperature: 0.3,
        responseFormat: "json",
        timeoutMs: SOLUTION_TIMEOUT_MS,
      } satisfies AiCompletionRequest);

      try {
        const jsonText = extractJsonFromResponse(completion.text);
        const parsed: unknown = JSON.parse(jsonText);

        if (!isSolutionPayload(parsed)) {
          lastError = "Response is not a JSON object";
          if (attempt < MAX_RETRIES) continue;
          return {
            success: false,
            error: { code: "INVALID_AI_RESPONSE", message: lastError },
          };
        }

        const validationError = validatePayload(parsed);
        if (validationError) {
          lastError = validationError;
          if (attempt < MAX_RETRIES) continue;
          return {
            success: false,
            error: { code: "INVALID_AI_RESPONSE", message: validationError },
          };
        }

        return {
          success: true,
          data: normalizePayload(parsed, {
            problemId: input.problemId,
            codeHash: input.codeHash,
            fallbackLocale: locale,
            model: completion.model,
          }),
        };
      } catch (error) {
        lastError =
          error instanceof Error ? error.message : "Failed to parse AI response";
        if (attempt < MAX_RETRIES) continue;

        return {
          success: false,
          error: { code: "PARSE_ERROR", message: lastError },
        };
      }
    }

    return {
      success: false,
      error: { code: "INVALID_AI_RESPONSE", message: lastError },
    };
  }
}
