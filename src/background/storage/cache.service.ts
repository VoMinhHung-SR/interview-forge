import type { AppLocale } from "@/shared/types";
import type { TranslationCacheEntry } from "@/shared/types/translation";

const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export function buildTranslationCacheKey(
  problemId: string,
  language: AppLocale,
): string {
  return `translation:${problemId}:${language}`;
}

export function isCacheExpired(createdAt: number, now = Date.now()): boolean {
  return now - createdAt > CACHE_TTL_MS;
}

export async function getTranslationCache(
  problemId: string,
  language: AppLocale,
): Promise<TranslationCacheEntry | null> {
  const key = buildTranslationCacheKey(problemId, language);
  const result = await chrome.storage.local.get(key);
  const entry = result[key] as TranslationCacheEntry | undefined;

  if (!entry) return null;

  if (isCacheExpired(entry.createdAt)) {
    await chrome.storage.local.remove(key);
    return null;
  }

  return entry;
}

export async function setTranslationCache(
  entry: TranslationCacheEntry,
): Promise<void> {
  const key = buildTranslationCacheKey(entry.problemId, entry.language);
  await chrome.storage.local.set({ [key]: entry });
}
