import type { SolutionCode } from "@/shared/types";
import { EDITOR_CONTAINER_SELECTORS, LANGUAGE_SELECTORS } from "./selectors";

const MIN_MEANINGFUL_CODE_LENGTH = 20;

interface MonacoGlobal {
  editor?: {
    getModels?: () => Array<{ getValue: () => string }>;
  };
}

function getMonacoFromWindow(win: Window): MonacoGlobal | null {
  const candidate = (win as Window & { monaco?: MonacoGlobal }).monaco;
  return candidate?.editor?.getModels ? candidate : null;
}

function extractFromMonaco(win: Window): string | null {
  const monaco = getMonacoFromWindow(win);
  const models = monaco?.editor?.getModels?.();
  if (!models?.length) return null;

  const values = models
    .map((model) => model.getValue().trim())
    .filter((value) => value.length > 0);

  if (values.length === 0) return null;
  return values.reduce((longest, current) =>
    current.length > longest.length ? current : longest,
  );
}

function extractFromViewLines(root: Document | Element): string | null {
  const lines = root.querySelectorAll(".view-line");
  if (lines.length === 0) return null;

  const text = Array.from(lines)
    .map((line) => line.textContent ?? "")
    .join("\n")
    .trim();

  return text.length > 0 ? text : null;
}

function extractCodeFromDocument(document: Document): string | null {
  const fromMonaco = extractFromMonaco(document.defaultView ?? window);
  if (fromMonaco) return fromMonaco;

  for (const selector of EDITOR_CONTAINER_SELECTORS) {
    const container = document.querySelector(selector);
    if (!container) continue;

    const fromContainerMonaco = extractFromMonaco(
      container.ownerDocument.defaultView ?? window,
    );
    if (fromContainerMonaco) return fromContainerMonaco;

    const fromLines = extractFromViewLines(container);
    if (fromLines) return fromLines;
  }

  const fromGlobalLines = extractFromViewLines(document);
  if (fromGlobalLines) return fromGlobalLines;

  const iframes = document.querySelectorAll("iframe");
  for (const iframe of iframes) {
    try {
      const iframeDoc = iframe.contentDocument;
      const iframeWin = iframe.contentWindow;
      if (!iframeDoc || !iframeWin) continue;

      const fromIframeMonaco = extractFromMonaco(iframeWin);
      if (fromIframeMonaco) return fromIframeMonaco;

      const fromIframeLines = extractFromViewLines(iframeDoc);
      if (fromIframeLines) return fromIframeLines;
    } catch {
      // Cross-origin iframe — skip
    }
  }

  return null;
}

function extractLanguage(document: Document): string {
  for (const selector of LANGUAGE_SELECTORS) {
    const element = document.querySelector(selector);
    const text = element?.textContent?.trim();
    if (text && text.length < 40) return text;
  }
  return "unknown";
}

export function extractSolutionCode(document: Document): SolutionCode | null {
  const code = extractCodeFromDocument(document);
  if (!code || code.length < MIN_MEANINGFUL_CODE_LENGTH) return null;

  const lineCount = code.split("\n").length;
  return {
    code,
    language: extractLanguage(document),
    lineCount,
  };
}
