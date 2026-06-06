import type { ProblemDifficulty } from "@/shared/types";
import { DIFFICULTY_SELECTORS } from "./selectors";
import { normalizeText } from "./dom-utils";

const DIFFICULTY_FROM_CLASS = /difficulty[-_](easy|medium|hard)/i;
const DIFFICULTY_FROM_TEXT = /^(easy|medium|hard)$/i;

/**
 * Extracts the LeetCode problem difficulty from the DOM.
 */
export function extractDifficulty(document: Document): ProblemDifficulty | null {
  const fromDom = extractFromSelectors(document);
  if (fromDom) return fromDom;

  return extractFromTitleArea(document);
}

function extractFromSelectors(document: Document): ProblemDifficulty | null {
  for (const selector of DIFFICULTY_SELECTORS) {
    const element = document.querySelector(selector);
    if (!element) continue;

    const parsed = parseDifficultyElement(element);
    if (parsed) return parsed;
  }

  return null;
}

function extractFromTitleArea(document: Document): ProblemDifficulty | null {
  const titleArea = document.querySelector(
    '[data-cy="question-title"], div.text-title-large, [class*="question-title"]',
  );
  if (!titleArea?.parentElement) return null;

  const siblings = titleArea.parentElement.querySelectorAll("div, span, a");
  for (const element of siblings) {
    const parsed = parseDifficultyElement(element);
    if (parsed) return parsed;
  }

  return null;
}

function parseDifficultyElement(element: Element): ProblemDifficulty | null {
  return (
    parseDifficultyFromClass(element.className) ??
    parseDifficultyToken(element.getAttribute("data-difficulty") ?? "") ??
    parseDifficultyToken(normalizeText(element.textContent ?? ""))
  );
}

function parseDifficultyFromClass(className: string): ProblemDifficulty | null {
  const match = className.match(DIFFICULTY_FROM_CLASS);
  if (!match?.[1]) return null;
  return normalizeDifficulty(match[1]);
}

function parseDifficultyToken(value: string): ProblemDifficulty | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const exact = trimmed.match(DIFFICULTY_FROM_TEXT);
  if (exact?.[1]) return normalizeDifficulty(exact[1]);

  const embedded = trimmed.match(/\b(easy|medium|hard)\b/i);
  if (embedded?.[1]) return normalizeDifficulty(embedded[1]);

  return null;
}

function normalizeDifficulty(value: string): ProblemDifficulty {
  const lower = value.toLowerCase();
  if (lower === "easy") return "Easy";
  if (lower === "medium") return "Medium";
  return "Hard";
}
