/** Prioritized CSS selectors — first match wins. */
export const TITLE_SELECTORS = [
  '[data-cy="question-title"]',
  'div.text-title-large a[href^="/problems/"]',
  'div.text-title-large',
  '[class*="question-title"]',
] as const;

export const DESCRIPTION_SELECTORS = [
  'div.elfjS[data-track-load="description_content"]',
  '[data-track-load="description_content"]',
  '[data-key="description-content"]',
  ".question-content__JfgR",
  "div.elfjS",
  "div.xFUwe",
] as const;
