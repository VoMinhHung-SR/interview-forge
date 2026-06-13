import { registerHandler } from "@/shared/messaging/router";
import {
  fetchActiveProblemContext,
  recordProblemView,
} from "@/background/problem-context-query";

registerHandler("GET_PROBLEM_CONTEXT", async () => {
  const result = await fetchActiveProblemContext();

  if (result.ok && result.data) {
    void recordProblemView(result.data).catch(() => {
      // Persistence must not block problem detection in the popup.
    });
  }

  return result;
});

registerHandler("PING", async () => ({ ok: true, data: "pong" }));
