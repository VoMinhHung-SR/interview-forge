export type PlatformId = "leetcode" | "hackerrank";

export type ProblemDifficulty = "Easy" | "Medium" | "Hard";

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
  difficulty?: ProblemDifficulty;
  problemId?: string;
  extractedAt: string;
}
