import type { ProblemContext } from "./problem-context";
import type { GenerateHintsRequest, HintLevel } from "./hints";
import type {
  HintSession,
  SaveProblemPayload,
  UnsaveProblemPayload,
} from "./persistence";
import type { AnalyzeSolutionRequest } from "./solution-analysis";
import type { TranslateProblemRequest } from "./translation";

/** Discriminated union of extension message payloads. */
export type ExtensionMessage =
  | { type: "PING" }
  | { type: "GET_PROBLEM_CONTEXT" }
  | { type: "PROBLEM_CONTEXT"; payload: ProblemContext | null }
  | {
      type: "GENERATE_HINTS";
      payload: GenerateHintsRequest & { level?: HintLevel };
    }
  | {
      type: "TRANSLATE_PROBLEM";
      payload: TranslateProblemRequest;
    }
  | { type: "GET_RECENT_PROBLEMS" }
  | { type: "GET_SAVED_PROBLEMS" }
  | { type: "SAVE_PROBLEM"; payload: SaveProblemPayload }
  | { type: "UNSAVE_PROBLEM"; payload: UnsaveProblemPayload }
  | { type: "GET_HINT_SESSION"; payload: { problemId: string } }
  | { type: "UPDATE_HINT_SESSION"; payload: HintSession }
  | { type: "GET_LEARNING_PROFILE" }
  | { type: "GET_ANALYSIS_CONTEXT" }
  | { type: "ANALYZE_SOLUTION"; payload?: AnalyzeSolutionRequest }
  | { type: "GET_SOLUTION_ANALYSIS"; payload: { problemId: string } };

export type ExtensionResponse<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export type MessageType = ExtensionMessage["type"];
