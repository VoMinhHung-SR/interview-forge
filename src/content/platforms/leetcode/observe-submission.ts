import { extractProblemContext } from "@/content/extract-problem-context";
import type {
  SubmissionDetectedPayload,
  SubmissionVerdict,
  SolutionCode,
} from "@/shared/types";
import { extractSolutionCode } from "./extract-solution-code";
import { isLeetCodeProblemPage } from "./extract-problem-context";
import {
  RESULT_PANEL_SELECTORS,
  SUBMIT_BUTTON_SELECTORS,
} from "./selectors";

interface SubmitSnapshot {
  problemId: string;
  solution: SolutionCode;
  problem: SubmissionDetectedPayload["problem"];
}

const VERDICT_PATTERNS: Array<{ verdict: SubmissionVerdict; pattern: RegExp }> =
  [
    { verdict: "accepted", pattern: /\baccepted\b/i },
    { verdict: "wrong_answer", pattern: /wrong answer/i },
    { verdict: "tle", pattern: /time limit exceeded/i },
    { verdict: "runtime_error", pattern: /runtime error/i },
    { verdict: "compile_error", pattern: /compile error/i },
  ];

const VERDICT_TIMEOUT_MS = 60_000;
const VERDICT_DEBOUNCE_MS = 150;

let pendingSnapshot: SubmitSnapshot | null = null;
let awaitingVerdict = false;
let resultObserver: MutationObserver | null = null;
let verdictTimeoutId: ReturnType<typeof setTimeout> | null = null;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let clickListenerAttached = false;
let currentPageUrl = "";

function parseVerdict(text: string): SubmissionVerdict | null {
  for (const { verdict, pattern } of VERDICT_PATTERNS) {
    if (pattern.test(text)) return verdict;
  }
  return null;
}

function extractResultSnippet(document: Document): string | undefined {
  for (const selector of RESULT_PANEL_SELECTORS) {
    const element = document.querySelector(selector);
    const text = element?.textContent?.trim();
    if (text && text.length > 0 && text.length < 2000) {
      return text;
    }
  }
  return undefined;
}

function captureSnapshot(document: Document, url: string): SubmitSnapshot | null {
  const problem = extractProblemContext(document, url);
  if (!problem?.problemId) return null;

  const solution = extractSolutionCode(document);
  if (!solution) return null;

  return {
    problemId: problem.problemId,
    solution,
    problem: {
      title: problem.title,
      description: problem.description,
      examples: problem.examples,
      constraints: problem.constraints,
    },
  };
}

function clearVerdictWatch(): void {
  resultObserver?.disconnect();
  resultObserver = null;
  if (verdictTimeoutId) {
    clearTimeout(verdictTimeoutId);
    verdictTimeoutId = null;
  }
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
  awaitingVerdict = false;
  pendingSnapshot = null;
}

function emitSubmissionDetected(
  document: Document,
  verdict: SubmissionVerdict,
): void {
  if (!pendingSnapshot || !awaitingVerdict) return;

  const payload: SubmissionDetectedPayload = {
    problemId: pendingSnapshot.problemId,
    verdict,
    solution: pendingSnapshot.solution,
    problem: pendingSnapshot.problem,
    resultSnippet: extractResultSnippet(document),
  };

  clearVerdictWatch();

  void chrome.runtime.sendMessage({
    type: "SUBMISSION_DETECTED",
    payload,
  });
}

function readResultPanelText(document: Document): string {
  return RESULT_PANEL_SELECTORS.map((selector) => {
    const element = document.querySelector(selector);
    return element?.textContent ?? "";
  }).join("\n");
}

function checkForVerdict(document: Document): void {
  if (!awaitingVerdict || !pendingSnapshot) return;

  const panelText = readResultPanelText(document);
  const verdict = parseVerdict(panelText);

  if (verdict) {
    emitSubmissionDetected(document, verdict);
  }
}

function scheduleVerdictCheck(document: Document): void {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    checkForVerdict(document);
  }, VERDICT_DEBOUNCE_MS);
}

function findResultObserveTarget(document: Document): Element | null {
  for (const selector of RESULT_PANEL_SELECTORS) {
    const element = document.querySelector(selector);
    if (element) return element.parentElement ?? element;
  }
  return null;
}

function startVerdictWatch(document: Document): void {
  clearVerdictWatch();
  awaitingVerdict = true;

  const scheduleCheck = (delayMs: number) => {
    setTimeout(() => checkForVerdict(document), delayMs);
  };

  const observeTarget = findResultObserveTarget(document) ?? document.body;
  resultObserver = new MutationObserver(() => scheduleVerdictCheck(document));
  resultObserver.observe(observeTarget, {
    childList: true,
    subtree: true,
    characterData: true,
  });

  scheduleCheck(400);
  scheduleCheck(1500);
  scheduleCheck(4000);
  scheduleCheck(8000);

  verdictTimeoutId = setTimeout(() => {
    clearVerdictWatch();
  }, VERDICT_TIMEOUT_MS);
}

function isSubmitClickTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;

  for (const selector of SUBMIT_BUTTON_SELECTORS) {
    if (target.matches(selector) || target.closest(selector)) {
      return true;
    }
  }

  const label = target.textContent?.trim().toLowerCase();
  if (label === "submit" && target.closest("button")) {
    return true;
  }

  return false;
}

function onDocumentClick(event: MouseEvent): void {
  if (!isSubmitClickTarget(event.target)) return;

  const snapshot = captureSnapshot(document, window.location.href);
  if (!snapshot) return;

  pendingSnapshot = snapshot;
  startVerdictWatch(document);
}

function attachClickListener(): void {
  if (clickListenerAttached) return;
  document.addEventListener("click", onDocumentClick, true);
  clickListenerAttached = true;
}

function detachClickListener(): void {
  if (!clickListenerAttached) return;
  document.removeEventListener("click", onDocumentClick, true);
  clickListenerAttached = false;
}

function stopSubmissionObserver(): void {
  clearVerdictWatch();
  detachClickListener();
}

export function startSubmissionObserver(_document: Document, url: string): void {
  if (!isLeetCodeProblemPage(url)) {
    stopSubmissionObserver();
    return;
  }

  if (currentPageUrl === url && clickListenerAttached) return;

  stopSubmissionObserver();
  currentPageUrl = url;
  attachClickListener();
}

export function initSubmissionObserver(document: Document): void {
  startSubmissionObserver(document, window.location.href);

  let lastUrl = window.location.href;

  const urlObserver = new MutationObserver(() => {
    const nextUrl = window.location.href;
    if (nextUrl === lastUrl) return;
    lastUrl = nextUrl;
    startSubmissionObserver(document, nextUrl);
  });

  urlObserver.observe(document.body, { childList: true, subtree: true });
}
