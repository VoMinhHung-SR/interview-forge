import { getSolutionEngine } from "@/background/ai";
import {
  getLatestSolutionAnalysis,
  getSolutionAnalysis,
  saveSolutionAnalysis,
} from "@/shared/cache/cache.service";
import { isSupportedPlatformUrl } from "@/shared/constants/platform-urls";
import { trackPattern } from "@/shared/domain";
import { registerHandler } from "@/shared/messaging/router";
import { sendTabMessage } from "@/shared/messaging/send-tab-message";
import type {
  AnalysisContext,
  AppLocale,
  ExtensionResponse,
  SolutionAnalysis,
} from "@/shared/types";
import { hashCode } from "@/shared/utils/code-hash";

const MIN_CODE_LENGTH = 20;

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

async function runSolutionAnalysis(options: {
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

  await saveSolutionAnalysis(result.data);

  const pattern = result.data.pattern.trim();
  if (pattern && pattern !== "Unknown") {
    await trackPattern(pattern);
  }

  return { ok: true, data: result.data };
}

registerHandler("ANALYZE_SOLUTION", async (message) => {
  if (message.type !== "ANALYZE_SOLUTION") {
    return { ok: false, error: "Invalid message type." };
  }

  const payload = message.payload ?? {};
  return runSolutionAnalysis(payload);
});

registerHandler("GET_SOLUTION_ANALYSIS", async (message) => {
  if (message.type !== "GET_SOLUTION_ANALYSIS") {
    return { ok: false, error: "Invalid message type." };
  }

  const analysis = await getLatestSolutionAnalysis(message.payload.problemId);
  return {
    ok: true,
    data: analysis,
  } satisfies ExtensionResponse<SolutionAnalysis | null>;
});
