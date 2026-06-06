import type { AppLocale, GenerateHintsRequest } from "@/shared/types/hints";

const LOCALE_LABELS: Record<AppLocale, string> = {
  en: "English",
  vi: "Vietnamese",
};

export const MENTOR_SYSTEM_PROMPT = `You are an expert coding interview mentor. Guide the learner toward discovering the solution themselves.

STRICT RULES — violations will cause rejection:
- NEVER provide complete solutions, full algorithms, or runnable code.
- NEVER write function implementations, pseudocode with full logic, or step-by-step code.
- NEVER name the exact data structure AND the exact technique together (e.g. "use a hash map with two pointers sliding window").

Hint level guidelines (hints array index 0 = level 1, index 1 = level 2, index 2 = level 3):
- Level 1 (abstract): High-level thinking questions. No data structures or algorithms named.
- Level 2 (specific): Narrow the problem space. Ask about edge cases or sub-problems. Still no algorithm names.
- Level 3 (direction): Suggest an approach category or technique name only. Still no code or implementation steps.

Language rules:
- Detect the user's preferred language from the Language field in the user prompt.
- If language is Vietnamese: respond entirely in Vietnamese with natural technical terminology.
- If language is English: respond entirely in English.
- Never mix languages in any field.

Respond with ONLY valid JSON. No markdown fences, no commentary outside JSON.`;

export const HINT_JSON_SCHEMA = `{
  "language": "en or vi",
  "pattern": "<algorithmic pattern name, e.g. Prefix Sum>",
  "difficulty": "<Easy | Medium | Hard>",
  "summary": "<one concise sentence describing the problem goal>",
  "hints": [
    "<level 1 abstract guiding question>",
    "<level 2 more specific guiding question>",
    "<level 3 technique or approach name only>"
  ],
  "complexity": {
    "time": "<e.g. O(n)>",
    "space": "<e.g. O(1)>"
  }
}`;

export function buildHintUserPrompt(request: GenerateHintsRequest): string {
  const { problem, maxLevel, previousHints, language = "en" } = request;

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
      `\nPreviously given hints (do NOT repeat; escalate specificity):\n${previousHints
        .map((h) => `Level ${h.level}: ${h.text}`)
        .join("\n")}`
    : "";

  const levelInstruction =
    maxLevel ?
      `Generate hints for levels 1 through ${maxLevel} only (leave higher levels as empty strings).`
    : "Generate all three hint levels.";

  return `${levelInstruction}

Language: ${LOCALE_LABELS[language]} (${language})

Problem: ${problem.title}

${problem.description}

${examplesText}${constraintsText}${previousText}

Return JSON matching this exact schema:
${HINT_JSON_SCHEMA}`;
}
