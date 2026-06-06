import { TITLE_SELECTORS } from "./selectors";
import { normalizeText, queryFirst } from "./dom-utils";

/**
 * Extracts the problem title from the LeetCode DOM.
 */
export function extractTitle(document: Document): string | null {
  const fromDom = queryFirst(document, TITLE_SELECTORS);
  if (fromDom) {
    const text = normalizeText(fromDom.textContent ?? "");
    if (text) return text;
  }

  const fromTabTitle = parseTitleFromDocumentTitle(document.title);
  if (fromTabTitle) return fromTabTitle;

  const fromUrl = parseTitleFromUrl(document.defaultView?.location.href ?? "");
  return fromUrl;
}

function parseTitleFromDocumentTitle(documentTitle: string): string | null {
  const part = documentTitle.split("-")[0]?.trim();
  return part || null;
}

function parseTitleFromUrl(url: string): string | null {
  const match = url.match(/\/problems\/([^/?#]+)/);
  if (!match?.[1]) return null;

  return match[1]
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
