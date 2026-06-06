import type { AiCompletionRequest, AiProvider } from "@/background/ai/providers/types";
import {
  normalizeAnalysisPayload,
  normalizeHintPayload,
  parseHintResponse,
  validateHintPayload,
} from "./guardrails";
import { toThreeHintTuple } from "./normalize";
import { buildHintUserPrompt, MENTOR_SYSTEM_PROMPT } from "./prompts";
import type {
  GenerateHintsRequest,
  HintEngineResponse,
  HintEngineResult,
  HintLevel,
} from "@/shared/types/hints";

const MAX_RETRIES = 2;

export interface HintEngineOptions {
  provider: AiProvider;
}

/**
 * Hint Engine — generates progressive mentor hints without revealing solutions.
 *
 * Flow:
 * 1. Build mentor prompt from problem context
 * 2. Call AI provider
 * 3. Parse structured JSON response
 * 4. Run guardrails (reject code, full solutions)
 * 5. Retry with stricter instructions if guardrails fail
 */
export class HintEngine {
  private provider: AiProvider;

  constructor(options: HintEngineOptions) {
    this.provider = options.provider;
  }

  /** Generate all three hint levels in one structured JSON response. */
  async generateHints(request: GenerateHintsRequest): Promise<HintEngineResult> {
    return this.runGeneration(request, 3);
  }

  /** Generate hints up to a specific level (progressive mode). */
  async generateHintLevel(
    request: GenerateHintsRequest,
    level: HintLevel,
  ): Promise<HintEngineResult> {
    return this.runGeneration({ ...request, maxLevel: level }, level);
  }

  private async runGeneration(
    request: GenerateHintsRequest,
    targetLevel: HintLevel,
  ): Promise<HintEngineResult> {
    let lastViolations: string[] = [];

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      const userPrompt = buildHintUserPrompt(request);
      const strictSuffix =
        attempt > 0 ?
          `\n\nRETRY ${attempt}: Previous response was rejected because: ${lastViolations.join("; ")}. Be more abstract. Ask questions only. No code.`
        : "";

      const completion = await this.provider.complete({
        systemPrompt: MENTOR_SYSTEM_PROMPT,
        userPrompt: userPrompt + strictSuffix,
        temperature: 0.7,
        responseFormat: "json",
      } satisfies AiCompletionRequest);

      try {
        const payload = parseHintResponse(completion.text);
        const guardrail = validateHintPayload(payload);

        if (!guardrail.passed) {
          lastViolations = guardrail.violations;
          if (attempt < MAX_RETRIES) continue;

          return {
            success: false,
            error: {
              code: "GUARDRAIL_REJECTED",
              message: `Hint guardrails failed: ${guardrail.violations.join("; ")}`,
            },
          };
        }

        const normalized = normalizeHintPayload(payload);
        const tuple = toThreeHintTuple(normalized, targetLevel);

        if (!tuple) {
          return {
            success: false,
            error: {
              code: "INVALID_AI_RESPONSE",
              message: "AI response missing required hint levels.",
            },
          };
        }

        const response: HintEngineResponse = {
          problemTitle: request.problem.title,
          analysis: normalizeAnalysisPayload(payload, request.language),
          hints: tuple,
          guardrailPassed: true,
          generatedAt: new Date().toISOString(),
          model: completion.model,
        };

        return { success: true, data: response };
      } catch (error) {
        if (attempt < MAX_RETRIES) {
          lastViolations = [
            error instanceof Error ? error.message : "Parse error",
          ];
          continue;
        }

        return {
          success: false,
          error: {
            code: "PARSE_ERROR",
            message:
              error instanceof Error ?
                error.message
              : "Failed to parse AI hint response",
          },
        };
      }
    }

    return {
      success: false,
      error: {
        code: "GUARDRAIL_REJECTED",
        message: "Failed to generate hints within guardrail constraints.",
      },
    };
  }
}
