import type { ProblemContext } from "./problem-context";
import type { AppLocale, GenerateHintsRequest } from "./hints";
import type {
  HintSession,
  SaveProblemPayload,
  UnsaveProblemPayload,
} from "./persistence";
import type { PopupInitRequest } from "./popup-init";
import type {
  AnalysisSettings,
  AnalyzeSolutionRequest,
  SubmissionDetectedPayload,
} from "./solution-analysis";
import type { TranslateProblemRequest } from "./translation";

/** Discriminated union of extension message payloads. */
export type ExtensionMessage =
  | { type: "PING" }
  | { type: "GET_PROBLEM_CONTEXT" }
  | { type: "GET_POPUP_INIT"; payload?: PopupInitRequest }
  | { type: "PROBLEM_CONTEXT_UPDATED"; payload: ProblemContext }
  | { type: "PROBLEM_CONTEXT"; payload: ProblemContext | null }
  | {
      type: "GENERATE_HINTS";
      payload: GenerateHintsRequest;
    }
  | {
      type: "TRANSLATE_PROBLEM";
      payload: TranslateProblemRequest;
    }
  | { type: "GET_RECENT_PROBLEMS" }
  | { type: "GET_SAVED_PROBLEMS" }
  | { type: "SAVE_PROBLEM"; payload: SaveProblemPayload }
  | { type: "UNSAVE_PROBLEM"; payload: UnsaveProblemPayload }
  | { type: "GET_HINT_SESSION"; payload: { problemId: string; locale: AppLocale } }
  | { type: "UPDATE_HINT_SESSION"; payload: HintSession & { locale: AppLocale } }
  | { type: "GET_LEARNING_PROFILE" }
  | { type: "GET_ANALYSIS_CONTEXT" }
  | { type: "ANALYZE_SOLUTION"; payload?: AnalyzeSolutionRequest }
  | { type: "GET_SOLUTION_ANALYSIS"; payload: { problemId: string } }
  | { type: "SUBMISSION_DETECTED"; payload: SubmissionDetectedPayload }
  | { type: "GET_ANALYSIS_SETTINGS" }
  | {
      type: "SET_ANALYSIS_SETTINGS";
      payload: Partial<AnalysisSettings>;
    }
  | { type: "CLEAR_ANALYSIS_BADGE" }
  | { type: "REFRESH_CONTEXT_MENUS" };

export type ExtensionResponse<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export type MessageType = ExtensionMessage["type"];
