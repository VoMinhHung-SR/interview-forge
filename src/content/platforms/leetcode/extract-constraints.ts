/**
 * Parses the constraints section from LeetCode description text.
 */
export function extractConstraints(descriptionText: string): string[] {
  const match = descriptionText.match(
    /Constraints\s*:\s*([\s\S]*?)(?=Follow[\s-]?up\s*:|$)/i,
  );
  if (!match?.[1]) return [];

  return match[1]
    .split("\n")
    .map((line) => line.replace(/^[\s•\-*]+/, "").trim())
    .filter(Boolean);
}
