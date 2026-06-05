/**
 * Returns the first element matching any selector in priority order.
 */
export function queryFirst(
  root: ParentNode,
  selectors: readonly string[],
): Element | null {
  for (const selector of selectors) {
    const element = root.querySelector(selector);
    if (element) return element;
  }
  return null;
}

/**
 * Normalizes whitespace in extracted text nodes.
 */
export function normalizeText(text: string): string {
  return text.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * Returns inner text preserving line breaks between block elements.
 */
export function extractBlockText(element: Element): string {
  const text =
    element instanceof HTMLElement ? element.innerText : element.textContent;
  return (text ?? "").replace(/\u00a0/g, " ").trim();
}
