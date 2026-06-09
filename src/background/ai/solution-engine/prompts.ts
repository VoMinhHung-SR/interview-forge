import type { AppLocale } from "@/shared/types";
import type { SolutionCode } from "@/shared/types/solution-analysis";

const LOCALE_LABELS: Record<AppLocale, string> = {
  en: "English",
  vi: "Vietnamese",
};

const MAX_CODE_CHARS = 12_000;

export const SOLUTION_SYSTEM_PROMPT = `You are a senior engineering interviewer reviewing a candidate's code solution.

Analyze the submitted code against the problem statement.
Respond ONLY with valid JSON matching the schema. No markdown fences.
Be direct and educational. Critique the code — do not rewrite the full solution.
Never fabricate test results. Base complexity on the actual implementation shown.
If code was truncated, note limitations in interviewFeedback.`;

export const SOLUTION_JSON_SCHEMA = `{
  "language": "en or vi",
  "pattern": "<detected algorithmic pattern>",
  "timeComplexity": "<e.g. O(n)>",
  "spaceComplexity": "<e.g. O(1)>",
  "bottlenecks": ["<performance bottleneck>", "..."],
  "optimizations": ["<improvement opportunity>", "..."],
  "missedEdgeCases": ["<edge case not handled>", "..."],
  "interviewFeedback": "<concise interview-style feedback paragraph>"
}`;

interface ProblemInput {
  title: string;
  description: string;
  examples: Array<{ input: string; output: string; explanation?: string }>;
  constraints?: string[];
}

export function buildManualAnalysisPrompt(
  problem: ProblemInput,
  solution: SolutionCode,
  language: AppLocale = "en",
): { userPrompt: string; truncated: boolean } {
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

  const truncated = solution.code.length > MAX_CODE_CHARS;
  const codeText =
    truncated ?
      solution.code.slice(0, MAX_CODE_CHARS) + "\n// ... [truncated]"
    : solution.code;

  const userPrompt = `Language: ${LOCALE_LABELS[language]} (${language})

Problem: ${problem.title}

${problem.description}

${examplesText}${constraintsText}

Solution language: ${solution.language}
Solution (${solution.lineCount} lines):
\`\`\`
${codeText}
\`\`\`

Return JSON matching this exact schema:
${SOLUTION_JSON_SCHEMA}`;

  return { userPrompt, truncated };
}
