import type { AppLocale, GenerateHintsRequest } from "@/shared/types/hints";
import { HINT_BATCH_SIZE, MAX_HINTS } from "@/shared/types/hints";

const LOCALE_LABELS: Record<AppLocale, string> = {
  en: "English",
  vi: "Vietnamese",
};

export const MENTOR_SYSTEM_PROMPT = `You are an expert coding interview mentor. Give concise, incremental hints like LeetCode — one short guiding sentence per hint.

STRICT RULES — violations will cause rejection:
- NEVER provide complete solutions, full algorithms, or runnable code.
- NEVER write function implementations or pseudocode with full logic.
- NEVER list step-by-step implementation instructions.
- Each hint must be ONE short sentence (max ~2 lines). Be direct and specific.
- You MAY name data structures and techniques when helpful (e.g. "Use DFS to compute depth from the root").
- Each hint must add NEW information — do not repeat previous hints.
- Hints must escalate in specificity across the batch.

Language rules:
- Detect the user's preferred language from the Language field in the user prompt.
- If language is Vietnamese: respond entirely in Vietnamese with natural technical terminology.
- If language is English: respond entirely in English.
- Never mix languages in any field.

Respond with ONLY valid JSON. No markdown fences, no commentary outside JSON.`;

export const HINT_JSON_SCHEMA = `{
  "language": "en or vi",
  "hints": ["<hint 1>", "<hint 2>", "..."],
  "canContinue": <true if more distinct hints could help after this batch, false otherwise>,
  "pattern": "<algorithmic pattern — required on first batch only>",
  "difficulty": "<Easy | Medium | Hard — required on first batch only>"
}`;

export function buildHintUserPrompt(
  request: GenerateHintsRequest,
  batchSize: number,
): string {
  const { problem, previousHints, language = "en" } = request;
  const startIndex = (previousHints?.length ?? 0) + 1;
  const isFirstBatch = startIndex === 1;

  const examplesText = problem.examples
    .map(
      (ex, i) =>
        `Example ${i + 1}:\nInput: ${ex.input}\nOutput: ${ex.output}${
          ex.explanation ? `\nExplanation: ${ex.explanation}` : ""
        }`,
    )
    .join("\n\n");

  const constraintsText =
    problem.constraints?.length ?
      `\nConstraints:\n${problem.constraints.map((c) => `- ${c}`).join("\n")}`
    : "";

  const previousText =
    previousHints?.length ?
      `\nPreviously given hints (do NOT repeat; continue the ladder):\n${previousHints
        .map((h) => `Hint ${h.index}: ${h.text}`)
        .join("\n")}`
    : "";

  const firstBatchNote =
    isFirstBatch ?
      "First batch — include pattern and difficulty fields."
    : "Follow-up batch — omit pattern and difficulty (empty string is fine).";

  return `Generate exactly ${batchSize} new hint(s), numbered from hint #${startIndex} through #${startIndex + batchSize - 1}.
Maximum total hints for this problem: ${MAX_HINTS}.
${firstBatchNote}

Language: ${LOCALE_LABELS[language]} (${language})

Problem: ${problem.title}

${problem.description}

${examplesText}${constraintsText}${previousText}

Return JSON matching this exact schema (hints array length must be ${batchSize}):
${HINT_JSON_SCHEMA}`;
}

export function resolveBatchSize(previousCount: number): number {
  const remaining = MAX_HINTS - previousCount;
  return Math.min(HINT_BATCH_SIZE, remaining);
}
