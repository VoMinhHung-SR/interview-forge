export const STORAGE_KEYS = {
  recentProblems: "if:recent_problems",
  savedProblems: "if:saved_problems",
  learningProfile: "if:learning_profile",
  hintSession: (problemId: string) => `if:hint:${problemId}`,
  translation: (problemId: string, locale: string) =>
    `if:translation:${problemId}:${locale}`,
  solutionAnalysis: (problemId: string, codeHash: string) =>
    `if:solution:${problemId}:${codeHash}`,
  solutionSubmission: (
    problemId: string,
    codeHash: string,
    verdict: string,
  ) => `if:solution:${problemId}:${codeHash}:submission:${verdict}`,
  solutionLatest: (problemId: string) => `if:solution_latest:${problemId}`,
  solutionCacheIndex: "if:solution_index",
  analysisSettings: "if:analysis_settings",
} as const;
