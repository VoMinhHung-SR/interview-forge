import type { LeetCodeExtractedFields, LeetCodeExtractionResult } from "./types";
import { extractTitle } from "./extract-title";
import { extractDescription, splitDescriptionBody } from "./extract-description";
import { extractExamples } from "./extract-examples";
import { extractConstraints } from "./extract-constraints";

const PROBLEM_PAGE_PATTERN = /leetcode\.com\/problems\/[^/?#]+/;

/**
 * Returns true when the URL points to a LeetCode problem page.
 */
export function isLeetCodeProblemPage(url: string): boolean {
  return PROBLEM_PAGE_PATTERN.test(url);
}

/**
 * Extracts raw fields from the LeetCode DOM.
 */
export function extractLeetCodeFields(document: Document): LeetCodeExtractedFields | null {
  const rawDescription = extractDescription(document);
  if (!rawDescription) return null;

  const title = extractTitle(document);
  if (!title) return null;

  const examples = extractExamples(rawDescription);
  const constraints = extractConstraints(rawDescription);
  const description = splitDescriptionBody(rawDescription);

  return {
    title,
    description: description || rawDescription,
    examples,
    ...(constraints.length > 0 ? { constraints } : {}),
  };
}

/**
 * Extracts a strongly typed LeetCode problem context from the current page.
 */
export function extractLeetCodeProblemContext(
  document: Document,
  url: string,
): LeetCodeExtractionResult {
  if (!isLeetCodeProblemPage(url)) {
    return {
      success: false,
      code: "NOT_PROBLEM_PAGE",
      message: "Current page is not a LeetCode problem page.",
    };
  }

  const title = extractTitle(document);
  if (!title) {
    return {
      success: false,
      code: "TITLE_NOT_FOUND",
      message: "Could not locate the problem title on this page.",
    };
  }

  const rawDescription = extractDescription(document);
  if (!rawDescription) {
    return {
      success: false,
      code: "DESCRIPTION_NOT_FOUND",
      message: "Could not locate the problem description on this page.",
    };
  }

  const examples = extractExamples(rawDescription);
  const constraints = extractConstraints(rawDescription);
  const description = splitDescriptionBody(rawDescription);

  return {
    success: true,
    data: {
      platform: "leetcode",
      url,
      title,
      description: description || rawDescription,
      examples,
      ...(constraints.length > 0 ? { constraints } : {}),
      extractedAt: new Date().toISOString(),
    },
  };
}
