import { addRecentProblem, trackProblemView } from "@/shared/domain";
import {
  isLeetCodeProblemPageUrl,
  isSupportedPlatformUrl,
} from "@/shared/constants/platform-urls";
import { sendTabMessage } from "@/shared/messaging/send-tab-message";
import { sleep } from "@/shared/utils/sleep";
import type { ExtensionResponse, ProblemContext } from "@/shared/types";
import { getTabSnapshot, setTabSnapshot } from "./tab-snapshot";

export async function recordProblemView(context: ProblemContext): Promise<void> {
  if (!context.problemId) return;

  const isNew = await addRecentProblem({
    problemId: context.problemId,
    title: context.title,
    difficulty: context.difficulty,
    platform: context.platform,
    url: context.url,
    viewedAt: Date.now(),
  });

  if (isNew) {
    await trackProblemView();
  }
}

export async function queryProblemContext(
  tabId: number,
  tabUrl: string,
): Promise<ExtensionResponse<ProblemContext | null>> {
  const cached = getTabSnapshot(tabId, tabUrl);
  if (cached) {
    return { ok: true, data: cached };
  }

  const shouldRetryExtraction = isLeetCodeProblemPageUrl(tabUrl);
  const maxAttempts = shouldRetryExtraction ? 3 : 1;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const response = await sendTabMessage<ProblemContext | null>(tabId, {
      type: "GET_PROBLEM_CONTEXT",
    });

    if (response?.ok && response.data) {
      setTabSnapshot(tabId, tabUrl, response.data);
      return response;
    }

    if (response?.ok) {
      if (shouldRetryExtraction && attempt < maxAttempts - 1) {
        await sleep(200 * (attempt + 1));
        continue;
      }
      return response;
    }

    if (attempt < maxAttempts - 1) {
      await sleep(150 * (attempt + 1));
    }
  }

  return {
    ok: false,
    error:
      "Could not reach the content script. Reload the problem page and try again.",
  };
}

export async function fetchActiveProblemContext(): Promise<
  ExtensionResponse<ProblemContext | null>
> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab?.id) {
    return { ok: false, error: "No active tab found." };
  }

  if (!tab.url || !isSupportedPlatformUrl(tab.url)) {
    return { ok: true, data: null };
  }

  return queryProblemContext(tab.id, tab.url);
}
