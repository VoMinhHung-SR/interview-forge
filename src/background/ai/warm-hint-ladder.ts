import { getHintEngine } from "@/background/ai";
import { getHintLadder, saveHintLadder } from "@/shared/cache/cache.service";
import { trackHintRequest, trackPattern } from "@/shared/domain";
import { storageService } from "@/shared/storage";
import { STORAGE_KEYS } from "@/shared/constants/storage-keys";
import type { AppLocale, GenerateHintsRequest, ProblemContext } from "@/shared/types";

const inFlight = new Set<string>();

async function isPrefetchEnabled(): Promise<boolean> {
  const stored = await storageService.get<boolean>(STORAGE_KEYS.prefetchHints);
  return stored !== false;
}

export async function warmHintLadder(
  problem: ProblemContext,
  locale: AppLocale,
): Promise<void> {
  if (!problem.problemId) return;
  if (!(await isPrefetchEnabled())) return;

  const cacheKey = `${problem.problemId}:${locale}`;
  if (inFlight.has(cacheKey)) return;

  const existing = await getHintLadder(problem.problemId, locale);
  if (existing && existing.hints.length > 0) return;

  const engine = getHintEngine();
  if (!engine) return;

  inFlight.add(cacheKey);

  try {
    const request: GenerateHintsRequest = {
      problem: {
        title: problem.title,
        description: problem.description,
        examples: problem.examples,
        constraints: problem.constraints,
      },
      problemId: problem.problemId,
      language: locale,
    };

    const result = await engine.generateHintBatch(request);
    if (!result.success) return;

    await trackHintRequest();

    const pattern = result.data.analysis.pattern?.trim();
    if (pattern && pattern !== "Unknown") {
      await trackPattern(pattern);
    }

    await saveHintLadder({
      problemId: problem.problemId,
      language: locale,
      hints: result.data.hints.map((hint) => hint.text),
      canContinue: result.data.canContinue,
      pattern: pattern && pattern !== "Unknown" ? pattern : "",
      difficulty:
        result.data.analysis.difficulty !== "Unknown" ?
          result.data.analysis.difficulty
        : "Unknown",
      updatedAt: Date.now(),
    });
  } finally {
    inFlight.delete(cacheKey);
  }
}
