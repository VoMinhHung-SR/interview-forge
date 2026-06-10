import type { AppLocale } from "./hints";
import type { ProblemContext } from "./problem-context";

export type SubmissionVerdict =
  | "accepted"
  | "wrong_answer"
  | "tle"
  | "runtime_error"
  | "compile_error";

export type SolutionAnalysisMode = "manual" | "submission";

export interface SolutionCode {
  code: string;
  language: string;
  lineCount: number;
}

export interface AnalysisContext {
  problem: ProblemContext | null;
  solution: SolutionCode | null;
}

export interface SolutionAnalysis {
  language: AppLocale;
  pattern: string;
  timeComplexity: string;
  spaceComplexity: string;
  bottlenecks: string[];
  optimizations: string[];
  missedEdgeCases: string[];
  interviewStrengths: string[];
  interviewImprovements: string[];
  /** @deprecated Legacy single-paragraph feedback from older cache entries */
  interviewFeedback?: string;
  analysisMode: SolutionAnalysisMode;
  submissionVerdict?: SubmissionVerdict;
  generatedAt: string;
  model: string;
  codeHash: string;
  problemId: string;
  cached?: boolean;
}

export interface AnalyzeSolutionRequest {
  language?: AppLocale;
  force?: boolean;
}

export interface SubmissionDetectedPayload {
  problemId: string;
  verdict: SubmissionVerdict;
  solution: SolutionCode;
  problem: {
    title: string;
    description: string;
    examples: Array<{ input: string; output: string; explanation?: string }>;
    constraints?: string[];
  };
  resultSnippet?: string;
}

export interface AnalysisSettings {
  autoAnalyzeOnSubmit: boolean;
}

export interface SolutionAnalysisJsonPayload {
  language?: string;
  pattern?: string;
  timeComplexity?: string;
  spaceComplexity?: string;
  bottlenecks?: string[];
  optimizations?: string[];
  missedEdgeCases?: string[];
  interviewStrengths?: string[];
  interviewImprovements?: string[];
  interviewFeedback?: string;
}

export type SolutionEngineErrorCode =
  | "PROVIDER_UNAVAILABLE"
  | "INVALID_AI_RESPONSE"
  | "PARSE_ERROR"
  | "NO_CODE"
  | "CODE_TOO_SHORT"
  | "NO_PROBLEM";

export interface SolutionEngineError {
  code: SolutionEngineErrorCode;
  message: string;
}

export type SolutionEngineResult =
  | { success: true; data: SolutionAnalysis }
  | { success: false; error: SolutionEngineError };

export interface SolutionLatestPointer {
  problemId: string;
  codeHash: string;
  cacheKey: string;
  analyzedAt: number;
  analysisMode?: SolutionAnalysisMode;
  submissionVerdict?: SubmissionVerdict;
}

export interface SolutionCacheIndexEntry {
  cacheKey: string;
  problemId: string;
  codeHash: string;
  updatedAt: number;
}

export interface SolutionCacheIndex {
  entries: SolutionCacheIndexEntry[];
}
