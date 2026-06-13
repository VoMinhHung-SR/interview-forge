import { getLatestSolutionAnalysis } from "@/shared/cache/cache.service";
import { getTranslation } from "@/shared/cache/cache.service";
import {
  getAnalysisSettings,
  getProfile,
  getRecentProblems,
  getSavedProblems,
  getSession,
} from "@/shared/domain";
import { createEmptyLearningProfile } from "@/shared/types/persistence";
import { registerHandler } from "@/shared/messaging/router";
import type {
  AppLocale,
  ExtensionResponse,
  PopupInitData,
} from "@/shared/types";
import { warmHintLadder } from "@/background/ai/warm-hint-ladder";
import {
  fetchActiveProblemContext,
  recordProblemView,
} from "@/background/problem-context-query";
import { setTabSnapshot } from "@/background/tab-snapshot";

registerHandler("GET_POPUP_INIT", async (message) => {
  if (message.type !== "GET_POPUP_INIT") {
    return { ok: false, error: "Invalid message type." };
  }

  const locale: AppLocale = message.payload?.locale === "vi" ? "vi" : "en";

  const problemResult = await fetchActiveProblemContext();
  if (!problemResult.ok) {
    return { ok: false, error: problemResult.error };
  }

  const problem = problemResult.data;

  if (problem) {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id && tab.url) {
      setTabSnapshot(tab.id, tab.url, problem);
    }

    void recordProblemView(problem).catch(() => {
      // Persistence must not block popup init.
    });

    void warmHintLadder(problem, locale);
  }

  const [recent, saved, profile, analysisSettings] = await Promise.all([
    getRecentProblems(),
    getSavedProblems(),
    getProfile(),
    getAnalysisSettings(),
  ]);

  const hintSession =
    problem?.problemId ?
      await getSession(problem.problemId, locale)
    : null;

  const analysis =
    problem?.problemId ?
      await getLatestSolutionAnalysis(problem.problemId)
    : null;

  let translation: PopupInitData["translation"] = null;
  if (locale === "vi" && problem?.problemId && problem.description) {
    const cached = await getTranslation(problem.problemId, locale);
    if (cached) {
      translation = {
        description: cached.translatedDescription,
        fromCache: true,
      };
    }
  }

  const data: PopupInitData = {
    problem,
    recent,
    saved,
    profile: profile ?? createEmptyLearningProfile(),
    hintSession,
    analysis,
    analysisSettings,
    translation,
  };

  return { ok: true, data } satisfies ExtensionResponse<PopupInitData>;
});

registerHandler("PROBLEM_CONTEXT_UPDATED", async (message, sender) => {
  if (message.type !== "PROBLEM_CONTEXT_UPDATED") {
    return { ok: false, error: "Invalid message type." };
  }

  const tabId = sender.tab?.id;
  const tabUrl = sender.tab?.url;
  if (!tabId || !tabUrl || !message.payload) {
    return { ok: true, data: null };
  }

  setTabSnapshot(tabId, tabUrl, message.payload);
  return { ok: true, data: null };
});
