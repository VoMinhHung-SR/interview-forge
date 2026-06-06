import { registerHandler } from "@/shared/messaging/router";
import type { ExtensionResponse, ProblemContext } from "@/shared/types";

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

    return response ?? { ok: true, data: null };
  } catch {
    return {
      ok: false,
      error:
        "Could not reach the content script. Reload the problem page and try again.",
    };
  }
});

registerHandler("PING", async () => ({ ok: true, data: "pong" }));
