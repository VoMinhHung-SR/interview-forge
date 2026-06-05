export type PlatformId = "leetcode" | "hackerrank";

export interface ProblemExample {
  input: string;
  output: string;
  explanation?: string;
}

export interface ProblemContext {
  platform: PlatformId;
  url: string;
  title: string;
  description: string;
  examples: ProblemExample[];
  constraints?: string[];
  extractedAt: string;
}
