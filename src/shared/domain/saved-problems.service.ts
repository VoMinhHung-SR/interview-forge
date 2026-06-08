import { STORAGE_KEYS } from "@/shared/constants/storage-keys";
import { storageService } from "@/shared/storage";
import type { SavedProblem } from "@/shared/types/persistence";

async function loadSavedProblems(): Promise<SavedProblem[]> {
  return (await storageService.get<SavedProblem[]>(STORAGE_KEYS.savedProblems)) ?? [];
}

async function persistSavedProblems(problems: SavedProblem[]): Promise<void> {
  await storageService.set(STORAGE_KEYS.savedProblems, problems);
}

export async function saveProblem(
  entry: Omit<SavedProblem, "savedAt">,
): Promise<void> {
  const existing = await loadSavedProblems();
  const without = existing.filter((p) => p.problemId !== entry.problemId);
  const saved: SavedProblem = { ...entry, savedAt: Date.now() };
  await persistSavedProblems([saved, ...without]);
}

export async function unsaveProblem(problemId: string): Promise<void> {
  const existing = await loadSavedProblems();
  await persistSavedProblems(existing.filter((p) => p.problemId !== problemId));
}

export async function isSaved(problemId: string): Promise<boolean> {
  const existing = await loadSavedProblems();
  return existing.some((p) => p.problemId === problemId);
}

export async function getSavedProblems(): Promise<SavedProblem[]> {
  const problems = await loadSavedProblems();
  return [...problems].sort((a, b) => b.savedAt - a.savedAt);
}
