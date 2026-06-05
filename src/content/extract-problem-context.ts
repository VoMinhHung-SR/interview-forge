import type { PlatformId, ProblemContext } from "@/shared/types";
import { detectPlatform } from "@/content/platforms";
import { extractLeetCodeProblemContext } from "@/content/platforms/leetcode";

/**
 * Extracts problem context for the current page based on detected platform.
 */
export function extractProblemContext(
  document: Document,
  url: string,
): ProblemContext | null {
  const platform = detectPlatform(url);

  if (platform === "leetcode") {
    const result = extractLeetCodeProblemContext(document, url);
    return result.success ? result.data : null;
  }

  return null;
}

export type { PlatformId, ProblemContext };
