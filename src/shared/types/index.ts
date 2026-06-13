export type {
  PlatformId,
  ProblemContext,
  ProblemDifficulty,
  ProblemExample,
} from "./problem-context";
export type {
  ExtensionMessage,
  ExtensionResponse,
  MessageType,
} from "./messages";
export type {
  AppLocale,
  GenerateHintsRequest,
  HintEngineError,
  HintEngineErrorCode,
  HintEngineJsonPayload,
  HintEngineResponse,
  HintEngineResult,
  HintLadderCache,
  HintStep,
  MentorMeta,
} from "./hints";
export { HINT_BATCH_SIZE, MAX_HINTS } from "./hints";
export type {
  TranslateProblemRequest,
  TranslateProblemResponse,
  TranslationCacheEntry,
  TranslationEngineData,
  TranslationEngineError,
  TranslationEngineErrorCode,
  TranslationEngineResult,
} from "./translation";
export type {
  HintSession,
  LearningProfile,
  RecentProblem,
  SaveProblemPayload,
  SaveProblemResult,
  SavedProblem,
  UnsaveProblemPayload,
} from "./persistence";
export type {
  PopupInitData,
  PopupInitRequest,
  PopupInitTranslation,
} from "./popup-init";
export type {
  AnalysisContext,
  AnalysisSettings,
  AnalyzeSolutionRequest,
  SolutionAnalysis,
  SolutionAnalysisJsonPayload,
  SolutionAnalysisMode,
  SolutionCacheIndex,
  SolutionCacheIndexEntry,
  SolutionCode,
  SolutionEngineError,
  SolutionEngineErrorCode,
  SolutionEngineResult,
  SolutionLatestPointer,
  SubmissionDetectedPayload,
  SubmissionVerdict,
} from "./solution-analysis";
export { createEmptyLearningProfile } from "./persistence";
