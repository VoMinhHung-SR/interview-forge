const TITLE_ID_PATTERN = /^(\d+)\./;
const URL_SLUG_PATTERN = /\/problems\/([^/?#]+)/;

/**
 * Parses the numeric LeetCode problem ID from the title or URL.
 * Primary: title prefix "2574. Left and Right Sum Differences"
 * Fallback: slug from URL (used only when numeric ID is unavailable)
 */
export function parseProblemId(title: string, url: string): string | null {
  const fromTitle = title.match(TITLE_ID_PATTERN);
  if (fromTitle?.[1]) return fromTitle[1];

  const fromUrl = url.match(URL_SLUG_PATTERN);
  if (fromUrl?.[1]) return fromUrl[1];

  return null;
}
