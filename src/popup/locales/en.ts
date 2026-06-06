export const en = {
  appName: "Interview Forge",
  appSubtitle: "AI Coding Interview Coach",

  problem: "Problem",
  difficulty: "Difficulty",
  examples: "Examples",
  exampleCount: "{{count}} example",
  exampleCount_plural: "{{count}} examples",
  detectingProblem: "Detecting problem on this page…",
  noProblem: "No problem detected. Open a LeetCode problem tab, then refresh.",
  refresh: "Refresh",
  retry: "Retry",

  actions: "Actions",
  getHint: "Get Hint",
  nextHint: "Next Hint (Level {{level}})",
  analyzePattern: "Analyze Pattern",
  complexity: "Complexity",
  generating: "Generating…",

  response: "Response",
  pattern: "Pattern",
  complexityTitle: "Complexity",
  hints: "Hints",
  hintLevel: "Level {{level}}",
  hintLevelAbstract: "Abstract",
  hintLevelSpecific: "Specific",
  hintLevelDirection: "Direction",
  time: "Time",
  space: "Space",

  emptyTitle: "Need help solving this problem?",
  emptySubtitle: "Get progressive hints, pattern analysis, and complexity — without spoiling the full solution.",
  allHintsShown: "All hint levels shown. Try solving from here!",

  loadingHint: "Generating hint",
  loadingPattern: "Analyzing pattern",
  loadingComplexity: "Analyzing complexity",
  loadingStageRead: "Reading problem description…",
  loadingStageAnalyze: "Analyzing problem structure…",
  loadingStageContact: "Contacting Gemini…",
  loadingWaiting: "Still waiting for AI…",
  loadingSlow: "Free-tier APIs can be slow or rate-limited. Please wait…",

  errorNoResponse:
    "No response from extension. Reload the extension in chrome://extensions and try again.",
  errorEmptyHint: "AI returned an empty hint. Please try again.",
  errorGeneric: "Something went wrong while generating the response.",
  errorTimeout:
    "Request timed out. Gemini may be rate-limited — wait a minute and retry.",

  language: "Language",
  languageEn: "English",
  languageVi: "Vietnamese",
} as const;

export type TranslationKey = keyof typeof en;
