/** Prioritized CSS selectors — first match wins. */
export const TITLE_SELECTORS = [
  '[data-cy="question-title"]',
  'div.text-title-large a[href^="/problems/"]',
  'div.text-title-large',
  '[class*="question-title"]',
] as const;

export const DIFFICULTY_SELECTORS = [
  '[data-difficulty="Easy"]',
  '[data-difficulty="Medium"]',
  '[data-difficulty="Hard"]',
  'div[class*="text-difficulty-easy"]',
  'div[class*="text-difficulty-medium"]',
  'div[class*="text-difficulty-hard"]',
  'span[class*="text-difficulty-easy"]',
  'span[class*="text-difficulty-medium"]',
  'span[class*="text-difficulty-hard"]',
  '[class*="difficulty-easy"]',
  '[class*="difficulty-medium"]',
  '[class*="difficulty-hard"]',
] as const;

export const DESCRIPTION_SELECTORS = [
  'div.elfjS[data-track-load="description_content"]',
  '[data-track-load="description_content"]',
  '[data-key="description-content"]',
  ".question-content__JfgR",
  "div.elfjS",
  "div.xFUwe",
] as const;
