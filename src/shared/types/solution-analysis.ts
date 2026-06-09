import type { AppLocale } from "./hints";
import type { ProblemContext } from "./problem-context";

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
  interviewFeedback: string;
  analysisMode: "manual";
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

export interface SolutionAnalysisJsonPayload {
  language?: string;
  pattern?: string;
  timeComplexity?: string;
  spaceComplexity?: string;
  bottlenecks?: string[];
  optimizations?: string[];
  missedEdgeCases?: string[];
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
