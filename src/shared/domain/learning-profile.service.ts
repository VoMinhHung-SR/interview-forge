import { STORAGE_KEYS } from "@/shared/constants/storage-keys";
import { storageService } from "@/shared/storage";
import {
  createEmptyLearningProfile,
  type LearningProfile,
} from "@/shared/types/persistence";

async function loadProfile(): Promise<LearningProfile> {
  return (
    (await storageService.get<LearningProfile>(STORAGE_KEYS.learningProfile)) ??
    createEmptyLearningProfile()
  );
}

async function persistProfile(profile: LearningProfile): Promise<void> {
  await storageService.set(STORAGE_KEYS.learningProfile, profile);
}

export async function trackProblemView(): Promise<void> {
  const profile = await loadProfile();
  profile.viewedProblems += 1;
  await persistProfile(profile);
}

export async function trackHintRequest(): Promise<void> {
  const profile = await loadProfile();
  profile.requestedHints += 1;
  await persistProfile(profile);
}

export async function trackPattern(patternName: string): Promise<void> {
  const trimmed = patternName.trim();
  if (!trimmed) return;

  const profile = await loadProfile();
  profile.patterns[trimmed] = (profile.patterns[trimmed] ?? 0) + 1;
  await persistProfile(profile);
}

export async function getProfile(): Promise<LearningProfile> {
  return loadProfile();
}
