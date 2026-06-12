import type { PlatformId, ProblemDifficulty } from "./problem-context";

export interface RecentProblem {
  problemId: string;
  title: string;
  difficulty?: ProblemDifficulty | string;
  platform: PlatformId | string;
  url?: string;
  viewedAt: number;
}

export interface SavedProblem {
  problemId: string;
  title: string;
  difficulty?: ProblemDifficulty | string;
  platform: PlatformId | string;
  url?: string;
  savedAt: number;
}

export interface HintSession {
  problemId: string;
  /** Number of hints revealed to the user. */
  currentLevel: number;
  /** Full fetched hint buffer (may include unrevealed hints). */
  hints: string[];
  canContinue?: boolean;
  updatedAt: number;
}

export interface LearningProfile {
  viewedProblems: number;
  requestedHints: number;
  patterns: Record<string, number>;
}

export interface SaveProblemPayload {
  problemId: string;
  title: string;
  difficulty?: string;
  platform: string;
  url?: string;
}

export interface SaveProblemResult {
  saved: boolean;
}

export interface UnsaveProblemPayload {
  problemId: string;
}

export interface HintSessionPayload {
  problemId: string;
}

const EMPTY_PROFILE: LearningProfile = {
  viewedProblems: 0,
  requestedHints: 0,
  patterns: {},
};

export function createEmptyLearningProfile(): LearningProfile {
  return { ...EMPTY_PROFILE, patterns: {} };
}
