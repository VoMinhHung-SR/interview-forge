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
  HintLevel,
  HintLevelContent,
  MentorAnalysis,
  MentorComplexity,
} from "./hints";
export { HINT_LEVEL_LABELS } from "./hints";
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
export { createEmptyLearningProfile } from "./persistence";
