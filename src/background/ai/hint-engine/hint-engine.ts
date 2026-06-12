import type { AiCompletionRequest, AiProvider } from "@/background/ai/providers/types";
import {
  extractHintStrings,
  normalizeMetaPayload,
  parseHintResponse,
  validateHintPayload,
} from "./guardrails";
import { buildHintUserPrompt, MENTOR_SYSTEM_PROMPT, resolveBatchSize } from "./prompts";
import type {
  GenerateHintsRequest,
  HintEngineResponse,
  HintEngineResult,
  HintStep,
} from "@/shared/types/hints";
import { MAX_HINTS } from "@/shared/types/hints";

const MAX_RETRIES = 1;
const HINT_TEMPERATURE = 0.5;

export interface HintEngineOptions {
  provider: AiProvider;
}

function toHintSteps(texts: string[], startIndex: number): HintStep[] {
  return texts.map((text, offset) => ({
    index: startIndex + offset,
    text,
  }));
}

/**
 * Hint Engine — generates a batch of concise hints per API call.
 */
export class HintEngine {
  private provider: AiProvider;

  constructor(options: HintEngineOptions) {
    this.provider = options.provider;
  }

  async generateHintBatch(request: GenerateHintsRequest): Promise<HintEngineResult> {
    const previousCount = request.previousHints?.length ?? 0;
    const batchSize = resolveBatchSize(previousCount);

    if (batchSize <= 0) {
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
      const userPrompt = buildHintUserPrompt(request, batchSize);
      const strictSuffix =
        attempt > 0 ?
          `\n\nRETRY ${attempt}: Previous response was rejected because: ${lastViolations.join("; ")}. Be more concise and specific. One short sentence per hint. No code.`
        : "";

      const completion = await this.provider.complete({
        systemPrompt: MENTOR_SYSTEM_PROMPT,
        userPrompt: userPrompt + strictSuffix,
        temperature: HINT_TEMPERATURE,
        responseFormat: "json",
      } satisfies AiCompletionRequest);

      try {
        const payload = parseHintResponse(completion.text, batchSize);
        const guardrail = validateHintPayload(payload, batchSize);

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

        const hintTexts = extractHintStrings(payload);
        const isFirstBatch = previousCount === 0;
        const totalAfterBatch = previousCount + hintTexts.length;
        const aiCanContinue = payload.canContinue !== false;
        const canContinue = aiCanContinue && totalAfterBatch < MAX_HINTS;

        const response: HintEngineResponse = {
          problemTitle: request.problem.title,
          hints: toHintSteps(hintTexts, previousCount + 1),
          canContinue,
          analysis: normalizeMetaPayload(payload, isFirstBatch),
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
