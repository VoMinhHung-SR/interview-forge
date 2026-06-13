import { STORAGE_KEYS } from "@/shared/constants/storage-keys";
import { storageService } from "@/shared/storage";
import type { AppLocale } from "@/shared/types";
import type {
  SolutionAnalysis,
  SolutionCacheIndex,
  SolutionLatestPointer,
  SubmissionVerdict,
} from "@/shared/types/solution-analysis";
import type { HintLadderCache } from "@/shared/types/hints";
import type { TranslationCacheEntry } from "@/shared/types/translation";

const TRANSLATION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const HINT_LADDER_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const SOLUTION_TTL_MS = 48 * 60 * 60 * 1000;
const MAX_SOLUTION_CACHE_ENTRIES = 100;
const MAX_TRANSLATION_CACHE_ENTRIES = 200;

interface TranslationIndexEntry {
  cacheKey: string;
  problemId: string;
  language: AppLocale;
  createdAt: number;
}

interface TranslationCacheIndex {
  entries: TranslationIndexEntry[];
}

async function loadTranslationIndex(): Promise<TranslationCacheIndex> {
  return (
    (await storageService.get<TranslationCacheIndex>(
      STORAGE_KEYS.translationIndex,
    )) ?? { entries: [] }
  );
}

async function persistTranslationIndex(index: TranslationCacheIndex): Promise<void> {
  await storageService.set(STORAGE_KEYS.translationIndex, index);
}

async function pruneTranslationIndex(
  index: TranslationCacheIndex,
): Promise<TranslationCacheIndex> {
  const sorted = [...index.entries].sort((a, b) => b.createdAt - a.createdAt);
  const kept = sorted.slice(0, MAX_TRANSLATION_CACHE_ENTRIES);
  const removed = sorted.slice(MAX_TRANSLATION_CACHE_ENTRIES);

  await Promise.all(removed.map((entry) => storageService.remove(entry.cacheKey)));

  return { entries: kept };
}

export async function getTranslation(
  problemId: string,
  language: AppLocale,
): Promise<TranslationCacheEntry | null> {
  const key = STORAGE_KEYS.translation(problemId, language);
  const entry = await storageService.get<TranslationCacheEntry>(key);
  return entry;
}

export async function saveTranslation(
  entry: TranslationCacheEntry,
): Promise<void> {
  const key = STORAGE_KEYS.translation(entry.problemId, entry.language);
  await storageService.set(key, entry, { ttlMs: TRANSLATION_TTL_MS });

  const index = await loadTranslationIndex();
  const without = index.entries.filter((item) => item.cacheKey !== key);
  const updated: TranslationCacheIndex = {
    entries: [
      {
        cacheKey: key,
        problemId: entry.problemId,
        language: entry.language,
        createdAt: entry.createdAt,
      },
      ...without,
    ],
  };
  await persistTranslationIndex(await pruneTranslationIndex(updated));
}

export async function getHintLadder(
  problemId: string,
  language: AppLocale,
): Promise<HintLadderCache | null> {
  const key = STORAGE_KEYS.hintLadder(problemId, language);
  return storageService.get<HintLadderCache>(key);
}

export async function saveHintLadder(entry: HintLadderCache): Promise<void> {
  const key = STORAGE_KEYS.hintLadder(entry.problemId, entry.language);
  await storageService.set(key, entry, { ttlMs: HINT_LADDER_TTL_MS });
}

async function loadSolutionIndex(): Promise<SolutionCacheIndex> {
  return (
    (await storageService.get<SolutionCacheIndex>(
      STORAGE_KEYS.solutionCacheIndex,
    )) ?? { entries: [] }
  );
}

async function persistSolutionIndex(index: SolutionCacheIndex): Promise<void> {
  await storageService.set(STORAGE_KEYS.solutionCacheIndex, index);
}

async function pruneSolutionIndex(
  index: SolutionCacheIndex,
): Promise<SolutionCacheIndex> {
  const sorted = [...index.entries].sort((a, b) => b.updatedAt - a.updatedAt);
  const kept = sorted.slice(0, MAX_SOLUTION_CACHE_ENTRIES);
  const removed = sorted.slice(MAX_SOLUTION_CACHE_ENTRIES);

  await Promise.all(removed.map((entry) => storageService.remove(entry.cacheKey)));

  return { entries: kept };
}

export async function getSolutionAnalysis(
  problemId: string,
  codeHash: string,
): Promise<SolutionAnalysis | null> {
  const key = STORAGE_KEYS.solutionAnalysis(problemId, codeHash);
  return storageService.get<SolutionAnalysis>(key);
}

export async function getSubmissionAnalysis(
  problemId: string,
  codeHash: string,
  verdict: SubmissionVerdict,
): Promise<SolutionAnalysis | null> {
  const key = STORAGE_KEYS.solutionSubmission(problemId, codeHash, verdict);
  return storageService.get<SolutionAnalysis>(key);
}

function resolveCacheKey(analysis: SolutionAnalysis): string {
  if (
    analysis.analysisMode === "submission" &&
    analysis.submissionVerdict
  ) {
    return STORAGE_KEYS.solutionSubmission(
      analysis.problemId,
      analysis.codeHash,
      analysis.submissionVerdict,
    );
  }
  return STORAGE_KEYS.solutionAnalysis(analysis.problemId, analysis.codeHash);
}

export async function saveSolutionAnalysis(
  analysis: SolutionAnalysis,
): Promise<void> {
  const cacheKey = resolveCacheKey(analysis);

  await storageService.set(cacheKey, analysis, { ttlMs: SOLUTION_TTL_MS });

  const pointer: SolutionLatestPointer = {
    problemId: analysis.problemId,
    codeHash: analysis.codeHash,
    cacheKey,
    analyzedAt: Date.parse(analysis.generatedAt) || Date.now(),
    analysisMode: analysis.analysisMode,
    submissionVerdict: analysis.submissionVerdict,
  };
  await storageService.set(
    STORAGE_KEYS.solutionLatest(analysis.problemId),
    pointer,
  );

  const index = await loadSolutionIndex();
  const without = index.entries.filter((entry) => entry.cacheKey !== cacheKey);
  const updated: SolutionCacheIndex = {
    entries: [
      {
        cacheKey,
        problemId: analysis.problemId,
        codeHash: analysis.codeHash,
        updatedAt: Date.now(),
      },
      ...without,
    ],
  };
  await persistSolutionIndex(await pruneSolutionIndex(updated));
}

export async function getLatestSolutionAnalysis(
  problemId: string,
): Promise<SolutionAnalysis | null> {
  const pointer = await storageService.get<SolutionLatestPointer>(
    STORAGE_KEYS.solutionLatest(problemId),
  );
  if (!pointer) return null;

  const analysis = await storageService.get<SolutionAnalysis>(pointer.cacheKey);
  if (!analysis) {
    await storageService.remove(STORAGE_KEYS.solutionLatest(problemId));
    return null;
  }

  return { ...analysis, cached: true };
}
