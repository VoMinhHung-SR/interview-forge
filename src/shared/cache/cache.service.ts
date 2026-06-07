import { STORAGE_KEYS } from "@/shared/constants/storage-keys";
import { storageService } from "@/shared/storage";
import type { AppLocale } from "@/shared/types";
import type { TranslationCacheEntry } from "@/shared/types/translation";

const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

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
  await storageService.set(key, entry, { ttlMs: CACHE_TTL_MS });
}
