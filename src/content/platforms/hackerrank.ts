/**
 * HackerRank problem page adapter.
 */

import type { ProblemContext, ProblemDifficulty, ProblemExample } from "@/shared/types";

export const PLATFORM = "hackerrank" as const;

const PROBLEM_PAGE_PATTERN =
  /hackerrank\.com\/(challenges|contests\/[^/]+\/challenges)\/[^/?#]+/;

export function isHackerRankProblemPage(url: string): boolean {
  return PROBLEM_PAGE_PATTERN.test(url);
}

function parseProblemId(url: string): string | undefined {
  const match = url.match(/\/challenges\/([^/?#]+)/);
  return match?.[1];
}

function parseDifficulty(text: string): ProblemDifficulty | undefined {
  const normalized = text.trim().toLowerCase();
  if (normalized === "easy") return "Easy";
  if (normalized === "medium") return "Medium";
  if (normalized === "hard") return "Hard";
  return undefined;
}

function extractTitle(document: Document): string | null {
  const selectors = [
    "h1.hrT-title",
    "h1.challenge-title",
    "h1",
    ".challenge-title",
  ];

  for (const selector of selectors) {
    const text = document.querySelector(selector)?.textContent?.trim();
    if (text) return text;
  }

  return null;
}

function extractDescription(document: Document): string | null {
  const selectors = [
    ".challenge-body-html",
    ".challenge-text",
    ".challenge_problem_statement",
    "[class*='problem-statement']",
    ".editorial-content",
  ];

  for (const selector of selectors) {
    const element = document.querySelector(selector);
    const text = element?.textContent?.trim();
    if (text && text.length > 20) return text;
  }

  return null;
}

function extractDifficulty(document: Document): ProblemDifficulty | undefined {
  const selectors = [
    ".difficulty",
    ".challenge-difficulty",
    "[class*='difficulty']",
  ];

  for (const selector of selectors) {
    const text = document.querySelector(selector)?.textContent?.trim();
    if (text) {
      const parsed = parseDifficulty(text);
      if (parsed) return parsed;
    }
  }

  return undefined;
}

function extractExamples(description: string): ProblemExample[] {
  const examples: ProblemExample[] = [];
  const blocks = description.split(/Sample Input\s*/i).slice(1);

  for (const block of blocks) {
    const inputMatch = block.match(/^([\s\S]*?)(?=Sample Output)/i);
    const outputMatch = block.match(/Sample Output\s*([\s\S]*?)(?=Sample Input|Explanation|$)/i);
    const input = inputMatch?.[1]?.trim();
    const output = outputMatch?.[1]?.trim();

    if (input && output) {
      examples.push({ input, output });
    }
  }

  return examples;
}

export function extractHackerRankProblemContext(
  document: Document,
  url: string,
): ProblemContext | null {
  if (!isHackerRankProblemPage(url)) return null;

  const title = extractTitle(document);
  const description = extractDescription(document);
  if (!title || !description) return null;

  const problemId = parseProblemId(url);
  const difficulty = extractDifficulty(document);
  const examples = extractExamples(description);

  return {
    platform: PLATFORM,
    url,
    title,
    description,
    examples,
    ...(difficulty ? { difficulty } : {}),
    ...(problemId ? { problemId } : {}),
    extractedAt: new Date().toISOString(),
  };
}
