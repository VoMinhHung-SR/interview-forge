import type { AiCompletionRequest, AiProvider } from "@/background/ai/providers/types";
import {
  buildTranslationUserPrompt,
  TRANSLATION_SYSTEM_PROMPT,
} from "./prompts";
import type {
  TranslateProblemRequest,
  TranslationEngineResult,
} from "@/shared/types/translation";

export interface TranslationEngineOptions {
  provider: AiProvider;
}

/**
 * Translation Engine — translates problem descriptions into natural Vietnamese
 * while preserving technical identifiers and algorithm terminology.
 */
export class TranslationEngine {
  private provider: AiProvider;

  constructor(options: TranslationEngineOptions) {
    this.provider = options.provider;
  }

  async translateProblem(
    request: TranslateProblemRequest,
  ): Promise<TranslationEngineResult> {
    if (request.language !== "vi") {
      return {
        success: false,
        error: {
          code: "UNSUPPORTED_LANGUAGE",
          message: "Only Vietnamese translation is supported.",
        },
      };
    }

    const description = request.description.trim();
    if (!description) {
      return {
        success: false,
        error: {
          code: "EMPTY_RESPONSE",
          message: "Problem description is empty.",
        },
      };
    }

    const completion = await this.provider.complete({
      systemPrompt: TRANSLATION_SYSTEM_PROMPT,
      userPrompt: buildTranslationUserPrompt(description),
      temperature: 0.3,
      responseFormat: "text",
    } satisfies AiCompletionRequest);

    const translatedDescription = completion.text.trim();
    if (!translatedDescription) {
      return {
        success: false,
        error: {
          code: "EMPTY_RESPONSE",
          message: "AI returned an empty translation.",
        },
      };
    }

    return {
      success: true,
      data: { translatedDescription },
    };
  }
}
