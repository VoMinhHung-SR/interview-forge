import { STORAGE_KEYS } from "@/shared/constants/storage-keys";
import { storageService } from "@/shared/storage";
import type { HintSession } from "@/shared/types/persistence";

export async function getSession(problemId: string): Promise<HintSession | null> {
  return storageService.get<HintSession>(STORAGE_KEYS.hintSession(problemId));
}

export async function saveSession(session: HintSession): Promise<HintSession> {
  const normalized: HintSession = {
    ...session,
    currentLevel: Math.max(session.currentLevel, 0),
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

  const nextLevel = existing.currentLevel + 1;
  const hints = [...existing.hints];

  if (hintText !== undefined) {
    hints.push(hintText);
  }

  return saveSession({
    problemId,
    currentLevel: nextLevel,
    hints,
    updatedAt: Date.now(),
  });
}
