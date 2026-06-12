import { resolveBatchSize } from "@/background/ai/hint-engine/prompts";
import { getHintEngine } from "@/background/ai";
import { getHintLadder, saveHintLadder } from "@/shared/cache/cache.service";
import { trackHintRequest, trackPattern } from "@/shared/domain";
import { registerHandler } from "@/shared/messaging/router";
import type {
  AppLocale,
  ExtensionResponse,
  HintEngineResponse,
  HintLadderCache,
  HintStep,
} from "@/shared/types";
import { MAX_HINTS } from "@/shared/types";

function toHintSteps(texts: string[], startIndex: number): HintStep[] {
  return texts.map((text, offset) => ({
    index: startIndex + offset,
    text,
  }));
}

function buildResponseFromLadder(
  ladder: HintLadderCache,
  previousCount: number,
  problemTitle: string,
): HintEngineResponse | null {
  if (ladder.hints.length <= previousCount) return null;

  const batchSize = resolveBatchSize(previousCount);
  const slice = ladder.hints.slice(previousCount, previousCount + batchSize);
  if (slice.length === 0) return null;

  const totalAfter = previousCount + slice.length;

  return {
    problemTitle,
    hints: toHintSteps(slice, previousCount + 1),
    canContinue: ladder.canContinue && totalAfter < MAX_HINTS,
    analysis: {
      pattern: ladder.pattern,
      difficulty: ladder.difficulty,
    },
    guardrailPassed: true,
    generatedAt: new Date(ladder.updatedAt).toISOString(),
    model: "cache",
    cached: true,
  };
}

registerHandler("GENERATE_HINTS", async (message) => {
  if (message.type !== "GENERATE_HINTS") {
    return { ok: false, error: "Invalid message type." };
  }

  const { problem, problemId, language = "en", previousHints } = message.payload;
  const previousCount = previousHints?.length ?? 0;
  const locale = language as AppLocale;

  if (problemId) {
    const cached = await getHintLadder(problemId, locale);
    if (cached) {
      const fromCache = buildResponseFromLadder(cached, previousCount, problem.title);
      if (fromCache) {
        return {
          ok: true,
          data: fromCache,
        } satisfies ExtensionResponse<HintEngineResponse>;
      }
    }
  }

  const engine = getHintEngine();
  if (!engine) {
    return {
      ok: false,
      error:
        "No AI provider configured. Set VITE_GEMINI_API_KEY in .env and rebuild.",
    };
  }

  const result = await engine.generateHintBatch(message.payload);

  if (!result.success) {
    return { ok: false, error: result.error.message };
  }

  await trackHintRequest();

  const pattern = result.data.analysis.pattern?.trim();
  if (pattern && pattern !== "Unknown") {
    await trackPattern(pattern);
  }

  if (problemId) {
    const prevTexts = previousHints?.map((hint) => hint.text) ?? [];
    const newTexts = result.data.hints.map((hint) => hint.text);
    const existing = await getHintLadder(problemId, locale);

    await saveHintLadder({
      problemId,
      language: locale,
      hints: [...prevTexts, ...newTexts],
      canContinue: result.data.canContinue,
      pattern: pattern && pattern !== "Unknown" ? pattern : existing?.pattern ?? "",
      difficulty:
        result.data.analysis.difficulty !== "Unknown" ?
          result.data.analysis.difficulty
        : existing?.difficulty ?? "Unknown",
      updatedAt: Date.now(),
    });
  }

  return {
    ok: true,
    data: result.data satisfies HintEngineResponse,
  } satisfies ExtensionResponse<HintEngineResponse>;
});
