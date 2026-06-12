import { extractJsonFromResponse } from "@/background/ai/hint-engine/guardrails";
import type { AiCompletionRequest, AiProvider } from "@/background/ai/providers/types";
import type { AppLocale } from "@/shared/types";
import type {
  SolutionAnalysis,
  SolutionAnalysisJsonPayload,
  SolutionAnalysisMode,
  SolutionCode,
  SolutionEngineResult,
  SubmissionVerdict,
} from "@/shared/types/solution-analysis";
import {
  buildManualAnalysisPrompt,
  buildSubmissionAnalysisPrompt,
  SOLUTION_JSON_SCHEMA,
  SOLUTION_SYSTEM_PROMPT,
} from "./prompts";

const MAX_RETRIES = 2;
const SOLUTION_TIMEOUT_MS = 90_000;

export interface SolutionEngineOptions {
  provider: AiProvider;
}

interface ProblemInput {
  title: string;
  description: string;
  examples: Array<{ input: string; output: string; explanation?: string }>;
  constraints?: string[];
}

interface AnalyzeManualInput {
  problem: ProblemInput;
  solution: SolutionCode;
  problemId: string;
  codeHash: string;
  language?: AppLocale;
}

interface AnalyzeSubmissionInput extends AnalyzeManualInput {
  verdict: SubmissionVerdict;
  resultSnippet?: string;
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
    analysisMode: SolutionAnalysisMode;
    submissionVerdict?: SubmissionVerdict;
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
    interviewStrengths: asStringArray(payload.interviewStrengths),
    interviewImprovements: asStringArray(payload.interviewImprovements),
    interviewFeedback: payload.interviewFeedback?.trim() || undefined,
    analysisMode: meta.analysisMode,
    submissionVerdict: meta.submissionVerdict,
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
  const strengths = asStringArray(payload.interviewStrengths);
  const improvements = asStringArray(payload.interviewImprovements);
  const legacy = payload.interviewFeedback?.trim();
  if (strengths.length === 0 && improvements.length === 0 && !legacy) {
    return "Missing interviewStrengths and interviewImprovements";
  }
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

    return this.runAnalysis(userPrompt, {
      problemId: input.problemId,
      codeHash: input.codeHash,
      fallbackLocale: locale,
      analysisMode: "manual",
      temperature: 0.3,
    });
  }

  async analyzeSubmission(
    input: AnalyzeSubmissionInput,
  ): Promise<SolutionEngineResult> {
    const locale = input.language ?? "en";
    const userPrompt = buildSubmissionAnalysisPrompt(
      input.problem,
      input.solution,
      input.verdict,
      locale,
      input.resultSnippet,
    );

    return this.runAnalysis(userPrompt, {
      problemId: input.problemId,
      codeHash: input.codeHash,
      fallbackLocale: locale,
      analysisMode: "submission",
      submissionVerdict: input.verdict,
      temperature: 0.4,
    });
  }

  private async runAnalysis(
    userPrompt: string,
    meta: {
      problemId: string;
      codeHash: string;
      fallbackLocale: AppLocale;
      analysisMode: SolutionAnalysisMode;
      submissionVerdict?: SubmissionVerdict;
      temperature: number;
    },
  ): Promise<SolutionEngineResult> {
    let lastError = "Invalid AI response";

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      const retrySuffix =
        attempt > 0 ?
          `\n\nRETRY ${attempt}: Previous response was invalid (${lastError}). Return complete JSON only.`
        : "";

      const completion = await this.provider.complete({
        systemPrompt: SOLUTION_SYSTEM_PROMPT,
        userPrompt: `${userPrompt}${retrySuffix}\n\nSchema:\n${SOLUTION_JSON_SCHEMA}`,
        temperature: meta.temperature,
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
            problemId: meta.problemId,
            codeHash: meta.codeHash,
            fallbackLocale: meta.fallbackLocale,
            model: completion.model,
            analysisMode: meta.analysisMode,
            submissionVerdict: meta.submissionVerdict,
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
