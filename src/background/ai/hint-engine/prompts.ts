import type { AppLocale, GenerateHintsRequest } from "@/shared/types/hints";

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
- Each new hint must add NEW information — do not repeat previous hints.

Language rules:
- Detect the user's preferred language from the Language field in the user prompt.
- If language is Vietnamese: respond entirely in Vietnamese with natural technical terminology.
- If language is English: respond entirely in English.
- Never mix languages in any field.

Respond with ONLY valid JSON. No markdown fences, no commentary outside JSON.`;

export const HINT_JSON_SCHEMA = `{
  "language": "en or vi",
  "hint": "<one concise incremental hint sentence>",
  "canContinue": <true if another distinct hint could still help, false if the learner has enough direction>,
  "pattern": "<algorithmic pattern name — required on first hint only, omit on later hints>",
  "difficulty": "<Easy | Medium | Hard — required on first hint only>"
}`;

export function buildHintUserPrompt(request: GenerateHintsRequest): string {
  const { problem, previousHints, language = "en" } = request;
  const hintNumber = (previousHints?.length ?? 0) + 1;
  const isFirstHint = hintNumber === 1;

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
      `\nPreviously given hints (do NOT repeat; escalate with the next logical step):\n${previousHints
        .map((h) => `Hint ${h.index}: ${h.text}`)
        .join("\n")}`
    : "";

  const firstHintNote =
    isFirstHint ?
      "This is hint 1 — include pattern and difficulty fields."
    : "This is a follow-up hint — omit pattern and difficulty fields (empty string is fine).";

  return `Generate exactly ONE new hint (hint #${hintNumber}).
${firstHintNote}

Language: ${LOCALE_LABELS[language]} (${language})

Problem: ${problem.title}

${problem.description}

${examplesText}${constraintsText}${previousText}

Return JSON matching this exact schema:
${HINT_JSON_SCHEMA}`;
}
