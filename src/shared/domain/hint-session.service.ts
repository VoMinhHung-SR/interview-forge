import { STORAGE_KEYS } from "@/shared/constants/storage-keys";
import { storageService } from "@/shared/storage";
import type { AppLocale } from "@/shared/types/hints";
import type { HintSession } from "@/shared/types/persistence";

function legacyKey(problemId: string): string {
  return STORAGE_KEYS.hintSessionLegacy(problemId);
}

async function migrateLegacySession(
  problemId: string,
  locale: AppLocale,
): Promise<HintSession | null> {
  const legacy = await storageService.get<HintSession>(legacyKey(problemId));
  if (!legacy) return null;

  const migrated: HintSession = {
    ...legacy,
    problemId,
    updatedAt: legacy.updatedAt ?? Date.now(),
  };

  await storageService.set(STORAGE_KEYS.hintSession(problemId, locale), migrated);
  await storageService.remove(legacyKey(problemId));
  return migrated;
}

export async function getSession(
  problemId: string,
  locale: AppLocale,
): Promise<HintSession | null> {
  const session = await storageService.get<HintSession>(
    STORAGE_KEYS.hintSession(problemId, locale),
  );
  if (session) return session;
  return migrateLegacySession(problemId, locale);
}

export async function saveSession(
  session: HintSession,
  locale: AppLocale,
): Promise<HintSession> {
  const normalized: HintSession = {
    ...session,
    currentLevel: Math.max(session.currentLevel, 0),
    updatedAt: Date.now(),
  };
  await storageService.set(
    STORAGE_KEYS.hintSession(session.problemId, locale),
    normalized,
  );
  return normalized;
}

export async function incrementLevel(
  problemId: string,
  locale: AppLocale,
  hintText?: string,
): Promise<HintSession> {
  const existing =
    (await getSession(problemId, locale)) ?? {
      problemId,
      currentLevel: 0,
      hints: [],
      updatedAt: Date.now(),
    };

  const nextLevel = existing.currentLevel + 1;
  const hints = [...existing.hints];

  if (hintText !== undefined) {
    hints.push(hintText);
  }

  return saveSession(
    {
      problemId,
      currentLevel: nextLevel,
      hints,
      updatedAt: Date.now(),
    },
    locale,
  );
}
