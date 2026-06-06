/**
 * Formats raw API errors into short, user-facing messages.
 */
export function formatAiError(raw: string): string {
  if (raw.includes("429") || raw.includes("RESOURCE_EXHAUSTED")) {
    return (
      "Gemini rate limit hit. Check aistudio.google.com/rate-limit — " +
      "free tier allows ~5 requests/min on gemini-2.5-flash."
    );
  }

  if (raw.includes("404")) {
    return "Gemini model not found. Set VITE_GEMINI_MODEL=gemini-2.5-flash in .env and rebuild.";
  }

  if (raw.includes("401") || raw.includes("API_KEY_INVALID")) {
    return "Invalid Gemini API key. Check VITE_GEMINI_API_KEY in .env and rebuild.";
  }

  if (raw.includes("403")) {
    return "Gemini API access denied. Verify your API key at aistudio.google.com.";
  }

  if (raw.length > 180) {
    return raw.slice(0, 180) + "…";
  }

  return raw;
}
