import type { ProblemContext, ProblemExample } from "@/shared/types";

/** Raw fields extracted from the LeetCode DOM before normalization. */
export interface LeetCodeExtractedFields {
  title: string;
  description: string;
  examples: ProblemExample[];
  constraints?: string[];
}

/** Successful extraction mapped to the shared extension contract. */
export interface LeetCodeProblemContext extends ProblemContext {
  platform: "leetcode";
}

export type LeetCodeExtractionErrorCode =
  | "NOT_PROBLEM_PAGE"
  | "TITLE_NOT_FOUND"
  | "DESCRIPTION_NOT_FOUND";

export interface LeetCodeExtractionFailure {
  success: false;
  code: LeetCodeExtractionErrorCode;
  message: string;
}

export interface LeetCodeExtractionSuccess {
  success: true;
  data: LeetCodeProblemContext;
}

export type LeetCodeExtractionResult =
  | LeetCodeExtractionSuccess
  | LeetCodeExtractionFailure;
