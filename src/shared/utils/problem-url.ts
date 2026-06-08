const LEETCODE_PROBLEM_URL = /leetcode\.com\/problems\/[^/?#]+/;
const HACKERRANK_PROBLEM_URL = /hackerrank\.com/;

export interface ProblemPageLink {
  url?: string;
}

function isValidProblemPageUrl(url: string): boolean {
  return LEETCODE_PROBLEM_URL.test(url) || HACKERRANK_PROBLEM_URL.test(url);
}

export function getProblemPageUrl(problem: ProblemPageLink): string | null {
  if (!problem.url || !isValidProblemPageUrl(problem.url)) {
    return null;
  }
  return problem.url;
}

export function openProblemPage(problem: ProblemPageLink): void {
  const url = getProblemPageUrl(problem);
  if (url) {
    void chrome.tabs.create({ url });
  }
}
