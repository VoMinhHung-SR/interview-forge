import { addRecentProblem, trackProblemView } from "@/shared/domain";
import {
  isLeetCodeProblemPageUrl,
  isSupportedPlatformUrl,
} from "@/shared/constants/platform-urls";
import { sendTabMessage } from "@/shared/messaging/send-tab-message";
import { registerHandler } from "@/shared/messaging/router";
import { sleep } from "@/shared/utils/sleep";
import type { ExtensionResponse, ProblemContext } from "@/shared/types";

async function recordProblemView(context: ProblemContext): Promise<void> {
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

async function queryProblemContext(
  tabId: number,
  tabUrl: string,
): Promise<ExtensionResponse<ProblemContext | null>> {
  const shouldRetryExtraction = isLeetCodeProblemPageUrl(tabUrl);
  const maxAttempts = shouldRetryExtraction ? 3 : 1;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const response = await sendTabMessage<ProblemContext | null>(tabId, {
      type: "GET_PROBLEM_CONTEXT",
    });

    if (response?.ok && response.data) {
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

registerHandler("GET_PROBLEM_CONTEXT", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab?.id) {
    return { ok: false, error: "No active tab found." };
  }

  if (!tab.url || !isSupportedPlatformUrl(tab.url)) {
    return {
      ok: true,
      data: null satisfies ProblemContext | null,
    };
  }

  const result = await queryProblemContext(tab.id, tab.url);

  if (result.ok && result.data) {
    void recordProblemView(result.data).catch(() => {
      // Persistence must not block problem detection in the popup.
    });
  }

  return result;
});

registerHandler("PING", async () => ({ ok: true, data: "pong" }));
