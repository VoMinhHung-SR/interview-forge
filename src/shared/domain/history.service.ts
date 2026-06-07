import { STORAGE_KEYS } from "@/shared/constants/storage-keys";
import { storageService } from "@/shared/storage";
import type { RecentProblem } from "@/shared/types/persistence";

const MAX_RECENT = 50;

async function loadRecentProblems(): Promise<RecentProblem[]> {
  return (await storageService.get<RecentProblem[]>(STORAGE_KEYS.recentProblems)) ?? [];
}

async function persistRecentProblems(problems: RecentProblem[]): Promise<void> {
  await storageService.set(STORAGE_KEYS.recentProblems, problems);
}

export async function addRecentProblem(
  entry: RecentProblem,
): Promise<boolean> {
  const existing = await loadRecentProblems();
  const index = existing.findIndex((p) => p.problemId === entry.problemId);

  if (index === 0) {
    return false;
  }

  const isNew = index === -1;
  const without = existing.filter((p) => p.problemId !== entry.problemId);
  const updated = [{ ...entry, viewedAt: Date.now() }, ...without].slice(
    0,
    MAX_RECENT,
  );

  await persistRecentProblems(updated);
  return isNew;
}

export async function getRecentProblems(): Promise<RecentProblem[]> {
  return loadRecentProblems();
}
