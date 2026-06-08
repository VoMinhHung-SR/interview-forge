import { STORAGE_KEYS } from "@/shared/constants/storage-keys";
import { storageService } from "@/shared/storage";
import type { HintSession } from "@/shared/types/persistence";

const MAX_LEVEL = 3;

export async function getSession(problemId: string): Promise<HintSession | null> {
  return storageService.get<HintSession>(STORAGE_KEYS.hintSession(problemId));
}

export async function saveSession(session: HintSession): Promise<HintSession> {
  const normalized: HintSession = {
    ...session,
    currentLevel: Math.min(Math.max(session.currentLevel, 0), MAX_LEVEL),
    updatedAt: Date.now(),
  };
  await storageService.set(STORAGE_KEYS.hintSession(session.problemId), normalized);
  return normalized;
}

export async function incrementLevel(
  problemId: string,
  hintText?: string,
): Promise<HintSession> {
  const existing =
    (await getSession(problemId)) ?? {
      problemId,
      currentLevel: 0,
      hints: [],
      updatedAt: Date.now(),
    };

  const nextLevel = Math.min(existing.currentLevel + 1, MAX_LEVEL);
  const hints = [...existing.hints];

  if (hintText !== undefined && hints.length < nextLevel) {
    hints.push(hintText);
  }

  return saveSession({
    problemId,
    currentLevel: nextLevel,
    hints,
    updatedAt: Date.now(),
  });
}
