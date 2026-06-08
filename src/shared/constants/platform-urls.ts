export const SUPPORTED_PLATFORM_PATTERN = /leetcode\.com|hackerrank\.com/;

export const LEETCODE_PROBLEM_PAGE_PATTERN = /leetcode\.com\/problems\/[^/?#]+/;

export function isSupportedPlatformUrl(url: string): boolean {
  return SUPPORTED_PLATFORM_PATTERN.test(url);
}

export function isLeetCodeProblemPageUrl(url: string): boolean {
  return LEETCODE_PROBLEM_PAGE_PATTERN.test(url);
}
