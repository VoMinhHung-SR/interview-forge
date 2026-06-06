/** Supported UI / AI response locales. */
export type AppLocale = "en" | "vi";

/** Hint escalation level — 1 (abstract) through 3 (strong direction). */
export type HintLevel = 1 | 2 | 3;

export const HINT_LEVEL_LABELS = {
  1: "abstract",
  2: "specific",
  3: "direction",
} as const satisfies Record<HintLevel, string>;

export interface HintLevelContent {
  level: HintLevel;
  label: (typeof HINT_LEVEL_LABELS)[HintLevel];
  text: string;
}

export interface MentorComplexity {
  time: string;
  space: string;
}

export interface MentorAnalysis {
  language: AppLocale;
  pattern: string;
  difficulty: string;
  summary: string;
  complexity: MentorComplexity;
}

/** Structured JSON returned by the Hint Engine. */
export interface HintEngineResponse {
  problemTitle: string;
  analysis: MentorAnalysis;
  hints: [HintLevelContent, HintLevelContent, HintLevelContent];
  guardrailPassed: boolean;
  generatedAt: string;
  model: string;
}

/** Raw JSON shape expected from the AI provider. */
export interface HintEngineJsonPayload {
  language?: string;
  pattern?: string;
  difficulty?: string;
  summary?: string;
  complexity?: {
    time?: string;
    space?: string;
  };
  hints:
    | [string, string, string]
    | Array<{ level: HintLevel; text: string }>;
}

export interface GenerateHintsRequest {
  problem: {
    title: string;
    description: string;
    examples: Array<{ input: string; output: string; explanation?: string }>;
    constraints?: string[];
  };
  /** UI locale — AI responds in this language. */
  language?: AppLocale;
  /** When set, only generate up to this level (progressive mode). */
  maxLevel?: HintLevel;
  /** Previously shown hints — used to ensure escalation in progressive mode. */
  previousHints?: HintLevelContent[];
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
