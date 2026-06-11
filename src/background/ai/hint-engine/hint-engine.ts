import type { AiCompletionRequest, AiProvider } from "@/background/ai/providers/types";
import {
  normalizeMetaPayload,
  parseHintResponse,
  validateHintPayload,
} from "./guardrails";
import { buildHintUserPrompt, MENTOR_SYSTEM_PROMPT } from "./prompts";
import type {
  GenerateHintsRequest,
  HintEngineResponse,
  HintEngineResult,
} from "@/shared/types/hints";
import { MAX_HINTS } from "@/shared/types/hints";

const MAX_RETRIES = 2;

export interface HintEngineOptions {
  provider: AiProvider;
}

/**
 * Hint Engine — generates one concise incremental hint per request.
 */
export class HintEngine {
  private provider: AiProvider;

  constructor(options: HintEngineOptions) {
    this.provider = options.provider;
  }

  async generateNextHint(request: GenerateHintsRequest): Promise<HintEngineResult> {
    const nextIndex = (request.previousHints?.length ?? 0) + 1;

    if (nextIndex > MAX_HINTS) {
      return {
        success: false,
        error: {
          code: "INVALID_AI_RESPONSE",
          message: `Maximum of ${MAX_HINTS} hints reached.`,
        },
      };
    }

    let lastViolations: string[] = [];

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      const userPrompt = buildHintUserPrompt(request);
      const strictSuffix =
        attempt > 0 ?
          `\n\nRETRY ${attempt}: Previous response was rejected because: ${lastViolations.join("; ")}. Be more concise and specific. One short sentence. No code.`
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

        const hintText = payload.hint!.trim();
        const isFirstHint = nextIndex === 1;
        const aiCanContinue = payload.canContinue !== false;
        const canContinue = aiCanContinue && nextIndex < MAX_HINTS;

        const response: HintEngineResponse = {
          problemTitle: request.problem.title,
          hint: { index: nextIndex, text: hintText },
          canContinue,
          analysis: normalizeMetaPayload(payload, isFirstHint),
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
