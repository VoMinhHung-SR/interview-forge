import { getSolutionEngine } from "@/background/ai";
import {
  getLatestSolutionAnalysis,
  getSubmissionAnalysis,
  getSolutionAnalysis,
  saveSolutionAnalysis,
} from "@/shared/cache/cache.service";
import {
  isLeetCodeProblemPageUrl,
  isSupportedPlatformUrl,
} from "@/shared/constants/platform-urls";
import {
  getAnalysisSettings,
  isAutoAnalyzeOnSubmitEnabled,
  setAnalysisSettings,
  trackPattern,
} from "@/shared/domain";
import { registerHandler } from "@/shared/messaging/router";
import { sendTabMessage } from "@/shared/messaging/send-tab-message";
import type {
  AnalysisContext,
  AnalysisSettings,
  AppLocale,
  ExtensionResponse,
  SolutionAnalysis,
  SubmissionDetectedPayload,
} from "@/shared/types";
import { hashCode } from "@/shared/utils/code-hash";

const MIN_CODE_LENGTH = 20;
const BADGE_TEXT = "!";

async function setAnalysisReadyBadge(): Promise<void> {
  try {
    await chrome.action.setBadgeText({ text: BADGE_TEXT });
    await chrome.action.setBadgeBackgroundColor({ color: "#7c3aed" });
  } catch {
    // Badge API may be unavailable in some contexts
  }
}

export async function clearAnalysisBadge(): Promise<void> {
  try {
    await chrome.action.setBadgeText({ text: "" });
  } catch {
    // ignore
  }
}

function isValidSubmissionSender(
  sender: chrome.runtime.MessageSender,
): boolean {
  const tabUrl = sender.tab?.url;
  return Boolean(tabUrl && isLeetCodeProblemPageUrl(tabUrl));
}

async function fetchAnalysisContext(
  tabId: number,
): Promise<ExtensionResponse<AnalysisContext>> {
  const response = await sendTabMessage<AnalysisContext>(tabId, {
    type: "GET_ANALYSIS_CONTEXT",
  });

  if (!response) {
    return {
      ok: false,
      error:
        "Could not reach the content script. Reload the problem page and try again.",
    };
  }

  return response;
}

async function persistAnalysisResult(
  analysis: SolutionAnalysis,
): Promise<SolutionAnalysis> {
  await saveSolutionAnalysis(analysis);

  const pattern = analysis.pattern.trim();
  if (pattern && pattern !== "Unknown") {
    await trackPattern(pattern);
  }

  return analysis;
}

async function runSubmissionAnalysis(
  payload: SubmissionDetectedPayload,
  language: AppLocale = "en",
): Promise<void> {
  if (payload.solution.code.length < MIN_CODE_LENGTH) return;

  const codeHash = await hashCode(payload.solution.code);

  const cached = await getSubmissionAnalysis(
    payload.problemId,
    codeHash,
    payload.verdict,
  );
  if (cached) {
    await persistAnalysisResult({ ...cached, cached: true });
    await setAnalysisReadyBadge();
    return;
  }

  const manualCached = await getSolutionAnalysis(payload.problemId, codeHash);
  if (manualCached) {
    const adapted: SolutionAnalysis = {
      ...manualCached,
      analysisMode: "submission",
      submissionVerdict: payload.verdict,
      generatedAt: new Date().toISOString(),
      cached: true,
    };
    await persistAnalysisResult(adapted);
    await setAnalysisReadyBadge();
    return;
  }

  const engine = getSolutionEngine();
  if (!engine) return;

  const result = await engine.analyzeSubmission({
    problem: payload.problem,
    solution: payload.solution,
    problemId: payload.problemId,
    codeHash,
    verdict: payload.verdict,
    resultSnippet: payload.resultSnippet,
    language,
  });

  if (!result.success) return;

  await persistAnalysisResult(result.data);
  await setAnalysisReadyBadge();
}

async function runManualAnalysis(options: {
  language?: AppLocale;
  force?: boolean;
}): Promise<ExtensionResponse<SolutionAnalysis>> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab?.id) {
    return { ok: false, error: "No active tab found." };
  }

  if (!tab.url || !isSupportedPlatformUrl(tab.url)) {
    return { ok: false, error: "Open a supported coding problem page first." };
  }

  const contextResult = await fetchAnalysisContext(tab.id);
  if (!contextResult.ok) {
    return { ok: false, error: contextResult.error };
  }

  const { problem, solution } = contextResult.data;

  if (!problem?.problemId) {
    return { ok: false, error: "Could not detect the current problem." };
  }

  if (!solution?.code || solution.code.length < MIN_CODE_LENGTH) {
    return {
      ok: false,
      error: "Write some code in the editor before analyzing.",
    };
  }

  const codeHash = await hashCode(solution.code);

  if (!options.force) {
    const cached = await getSolutionAnalysis(problem.problemId, codeHash);
    if (cached) {
      return { ok: true, data: { ...cached, cached: true } };
    }
  }

  const engine = getSolutionEngine();
  if (!engine) {
    return {
      ok: false,
      error:
        "No AI provider configured. Set VITE_GEMINI_API_KEY in .env and rebuild.",
    };
  }

  const result = await engine.analyzeManual({
    problem: {
      title: problem.title,
      description: problem.description,
      examples: problem.examples,
      constraints: problem.constraints,
    },
    solution,
    problemId: problem.problemId,
    codeHash,
    language: options.language,
  });

  if (!result.success) {
    return { ok: false, error: result.error.message };
  }

  const saved = await persistAnalysisResult(result.data);
  return { ok: true, data: saved };
}

registerHandler("ANALYZE_SOLUTION", async (message) => {
  if (message.type !== "ANALYZE_SOLUTION") {
    return { ok: false, error: "Invalid message type." };
  }

  const payload = message.payload ?? {};
  return runManualAnalysis(payload);
});

registerHandler("GET_SOLUTION_ANALYSIS", async (message, _sender) => {
  if (message.type !== "GET_SOLUTION_ANALYSIS") {
    return { ok: false, error: "Invalid message type." };
  }

  await clearAnalysisBadge();

  const analysis = await getLatestSolutionAnalysis(message.payload.problemId);
  return {
    ok: true,
    data: analysis,
  } satisfies ExtensionResponse<SolutionAnalysis | null>;
});

registerHandler("SUBMISSION_DETECTED", async (message, sender) => {
  if (message.type !== "SUBMISSION_DETECTED") {
    return { ok: false, error: "Invalid message type." };
  }

  if (!isValidSubmissionSender(sender)) {
    return { ok: false, error: "Invalid submission source." };
  }

  const enabled = await isAutoAnalyzeOnSubmitEnabled();
  if (!enabled) {
    return { ok: true, data: { skipped: true } };
  }

  void runSubmissionAnalysis(message.payload).catch(() => {
    // Auto-analysis must not block content script response
  });

  return { ok: true, data: { queued: true } };
});

registerHandler("GET_ANALYSIS_SETTINGS", async () => {
  const settings = await getAnalysisSettings();
  return {
    ok: true,
    data: settings,
  } satisfies ExtensionResponse<AnalysisSettings>;
});

registerHandler("SET_ANALYSIS_SETTINGS", async (message) => {
  if (message.type !== "SET_ANALYSIS_SETTINGS") {
    return { ok: false, error: "Invalid message type." };
  }

  const settings = await setAnalysisSettings(message.payload);
  return {
    ok: true,
    data: settings,
  } satisfies ExtensionResponse<AnalysisSettings>;
});

registerHandler("CLEAR_ANALYSIS_BADGE", async () => {
  await clearAnalysisBadge();
  return { ok: true, data: null };
});
