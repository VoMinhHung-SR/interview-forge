/** Supported UI / AI response locales. */
export type AppLocale = "en" | "vi";

export const MAX_HINTS = 8;
/** Hints generated per API call (reveal one at a time in UI). */
export const HINT_BATCH_SIZE = 3;

export interface HintStep {
  index: number;
  text: string;
}

export interface MentorMeta {
  pattern: string;
  difficulty: string;
}

/** Structured JSON returned by the Hint Engine (batch per request). */
export interface HintEngineResponse {
  problemTitle: string;
  hints: HintStep[];
  canContinue: boolean;
  analysis: MentorMeta;
  guardrailPassed: boolean;
  generatedAt: string;
  model: string;
  cached?: boolean;
}

/** Raw JSON shape expected from the AI provider. */
export interface HintEngineJsonPayload {
  language?: string;
  hints?: string[];
  canContinue?: boolean;
  pattern?: string;
  difficulty?: string;
}

export interface HintLadderCache {
  problemId: string;
  language: AppLocale;
  hints: string[];
  canContinue: boolean;
  pattern: string;
  difficulty: string;
  updatedAt: number;
}

export interface GenerateHintsRequest {
  problem: {
    title: string;
    description: string;
    examples: Array<{ input: string; output: string; explanation?: string }>;
    constraints?: string[];
  };
  problemId?: string;
  /** UI locale — AI responds in this language. */
  language?: AppLocale;
  /** All hints generated so far — used to escalate without repeating. */
  previousHints?: HintStep[];
}

export type HintEngineErrorCode =
  | "PROVIDER_UNAVAILABLE"
  | "INVALID_AI_RESPONSE"
  | "GUARDRAIL_REJECTED"
  | "PARSE_ERROR";

export interface HintEngineError {
  code: HintEngineErrorCode;
  message: string;
}

export type HintEngineResult =
  | { success: true; data: HintEngineResponse }
  | { success: false; error: HintEngineError };
