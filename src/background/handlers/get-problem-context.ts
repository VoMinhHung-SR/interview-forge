import { addRecentProblem, trackProblemView } from "@/shared/domain";
import { registerHandler } from "@/shared/messaging/router";
import type { ExtensionResponse, ProblemContext } from "@/shared/types";

async function recordProblemView(context: ProblemContext): Promise<void> {
  if (!context.problemId) return;

  const isNew = await addRecentProblem({
    problemId: context.problemId,
    title: context.title,
    difficulty: context.difficulty,
    platform: context.platform,
    viewedAt: Date.now(),
  });

  if (isNew) {
    await trackProblemView();
  }
}

registerHandler("GET_PROBLEM_CONTEXT", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab?.id) {
    return { ok: false, error: "No active tab found." };
  }

  if (!tab.url || !/leetcode\.com|hackerrank\.com/.test(tab.url)) {
    return {
      ok: true,
      data: null satisfies ProblemContext | null,
    };
  }

  try {
    const response = await chrome.tabs.sendMessage<
      { type: "GET_PROBLEM_CONTEXT" },
      ExtensionResponse<ProblemContext | null>
    >(tab.id, { type: "GET_PROBLEM_CONTEXT" });

    const result = response ?? { ok: true as const, data: null };

    if (result.ok && result.data) {
      await recordProblemView(result.data);
    }

    return result;
  } catch {
    return {
      ok: false,
      error:
        "Could not reach the content script. Reload the problem page and try again.",
    };
  }
});

registerHandler("PING", async () => ({ ok: true, data: "pong" }));
