import { DESCRIPTION_SELECTORS } from "./selectors";
import { extractBlockText, queryFirst } from "./dom-utils";

/**
 * Extracts the full problem description container text from the LeetCode DOM.
 */
export function extractDescription(document: Document): string | null {
  const element = queryFirst(document, DESCRIPTION_SELECTORS);
  if (!element) return null;

  const text = extractBlockText(element);
  return text || null;
}

/**
 * Returns the narrative portion of the description (text before examples).
 */
export function splitDescriptionBody(fullDescription: string): string {
  const exampleStart = fullDescription.search(/\bExample\s+1\s*:/i);
  if (exampleStart === -1) return fullDescription.trim();
  return fullDescription.slice(0, exampleStart).trim();
}
