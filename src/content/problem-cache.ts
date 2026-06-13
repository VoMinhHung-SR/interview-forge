import type { ProblemContext } from "@/shared/types";
import { extractProblemContext } from "@/content/extract-problem-context";

const CACHE_TTL_MS = 30_000;

interface CachedEntry {
  url: string;
  context: ProblemContext;
  at: number;
}

let cached: CachedEntry | null = null;
let refreshTimer: ReturnType<typeof setTimeout> | null = null;

export function getCachedProblemContext(url: string): ProblemContext | null {
  if (!cached || cached.url !== url) return null;
  if (Date.now() - cached.at > CACHE_TTL_MS) return null;
  return cached.context;
}

export function refreshProblemCache(document: Document, url: string): ProblemContext | null {
  const context = extractProblemContext(document, url);
  if (context) {
    cached = { url, context, at: Date.now() };
    void chrome.runtime.sendMessage({
      type: "PROBLEM_CONTEXT_UPDATED",
      payload: context,
    });
  }
  return context;
}

export function scheduleProblemCacheRefresh(document: Document, url: string): void {
  if (refreshTimer) clearTimeout(refreshTimer);
  refreshTimer = setTimeout(() => {
    refreshProblemCache(document, url);
  }, 400);
}

export function initProblemCache(document: Document, url: string): void {
  refreshProblemCache(document, url);

  let lastUrl = url;
  const observer = new MutationObserver(() => {
    const currentUrl = document.defaultView?.location.href ?? url;
    if (currentUrl !== lastUrl) {
      lastUrl = currentUrl;
      cached = null;
      refreshProblemCache(document, currentUrl);
      return;
    }
    scheduleProblemCacheRefresh(document, currentUrl);
  });

  observer.observe(document.body, { childList: true, subtree: true });
}
