import {
  getProfile,
  getRecentProblems,
  getSavedProblems,
  getSession,
  saveProblem,
  saveSession,
  unsaveProblem,
} from "@/shared/domain";
import { registerHandler } from "@/shared/messaging/router";
import type {
  ExtensionResponse,
  HintSession,
  LearningProfile,
  RecentProblem,
  SaveProblemResult,
  SavedProblem,
} from "@/shared/types";

registerHandler("GET_RECENT_PROBLEMS", async () => {
  const data = await getRecentProblems();
  return { ok: true, data } satisfies ExtensionResponse<RecentProblem[]>;
});

registerHandler("GET_SAVED_PROBLEMS", async () => {
  const data = await getSavedProblems();
  return { ok: true, data } satisfies ExtensionResponse<SavedProblem[]>;
});

registerHandler("SAVE_PROBLEM", async (message) => {
  if (message.type !== "SAVE_PROBLEM") {
    return { ok: false, error: "Invalid message type." };
  }

  await saveProblem(message.payload);
  return {
    ok: true,
    data: { saved: true } satisfies SaveProblemResult,
  } satisfies ExtensionResponse<SaveProblemResult>;
});

registerHandler("UNSAVE_PROBLEM", async (message) => {
  if (message.type !== "UNSAVE_PROBLEM") {
    return { ok: false, error: "Invalid message type." };
  }

  await unsaveProblem(message.payload.problemId);
  return {
    ok: true,
    data: { saved: false } satisfies SaveProblemResult,
  } satisfies ExtensionResponse<SaveProblemResult>;
});

registerHandler("GET_HINT_SESSION", async (message) => {
  if (message.type !== "GET_HINT_SESSION") {
    return { ok: false, error: "Invalid message type." };
  }

  const data = await getSession(
    message.payload.problemId,
    message.payload.locale,
  );
  return { ok: true, data } satisfies ExtensionResponse<HintSession | null>;
});

registerHandler("UPDATE_HINT_SESSION", async (message) => {
  if (message.type !== "UPDATE_HINT_SESSION") {
    return { ok: false, error: "Invalid message type." };
  }

  const { locale, ...session } = message.payload;
  const data = await saveSession(session, locale);
  return { ok: true, data } satisfies ExtensionResponse<HintSession>;
});

registerHandler("GET_LEARNING_PROFILE", async () => {
  const data = await getProfile();
  return { ok: true, data } satisfies ExtensionResponse<LearningProfile>;
});
