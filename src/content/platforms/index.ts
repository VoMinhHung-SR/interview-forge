import type { PlatformId } from "@/shared/types";

/**
 * Returns the platform identifier for a URL, or null if unsupported.
 */
export function detectPlatform(url: string): PlatformId | null {
  if (/leetcode\.com/.test(url)) return "leetcode";
  if (/hackerrank\.com/.test(url)) return "hackerrank";
  return null;
}
