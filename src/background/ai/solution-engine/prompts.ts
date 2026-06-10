import type { AppLocale } from "@/shared/types";
import type {
  SolutionCode,
  SubmissionVerdict,
} from "@/shared/types/solution-analysis";

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
If code was truncated, note limitations in interviewImprovements.`;

export const SOLUTION_JSON_SCHEMA = `{
  "language": "en or vi",
  "pattern": "<detected algorithmic pattern>",
  "timeComplexity": "<e.g. O(n)>",
  "spaceComplexity": "<e.g. O(1)>",
  "bottlenecks": ["<performance bottleneck>", "..."],
  "optimizations": ["<improvement opportunity>", "..."],
  "missedEdgeCases": ["<edge case not handled>", "..."],
  "interviewStrengths": ["<what the candidate did well — 2-4 concise bullets>"],
  "interviewImprovements": ["<what to improve for interviews — 2-4 concise bullets>"]
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

const VERDICT_FOCUS: Record<SubmissionVerdict, string> = {
  accepted:
    "Submission was Accepted. Focus on optimizations, interview articulation, and subtle edge cases worth mentioning.",
  wrong_answer:
    "Submission was Wrong Answer. Focus on logic bugs, incorrect assumptions, and debugging paths.",
  tle: "Submission hit Time Limit Exceeded. Focus on complexity bottlenecks and alternative approaches.",
  runtime_error:
    "Submission had a Runtime Error. Focus on bug localization, bounds checks, and null/empty handling.",
  compile_error:
    "Submission had a Compile Error. Focus on syntax, types, and API misuse in the chosen language.",
};

function formatCodeBlock(solution: SolutionCode): string {
  const truncated = solution.code.length > MAX_CODE_CHARS;
  const codeText =
    truncated ?
      solution.code.slice(0, MAX_CODE_CHARS) + "\n// ... [truncated]"
    : solution.code;
  return `\`\`\`\n${codeText}\n\`\`\``;
}

export function buildSubmissionAnalysisPrompt(
  problem: ProblemInput,
  solution: SolutionCode,
  verdict: SubmissionVerdict,
  language: AppLocale = "en",
  resultSnippet?: string,
): string {
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

  const resultText =
    resultSnippet ?
      `\nLeetCode result snippet:\n${resultSnippet.slice(0, 800)}`
    : "";

  return `Language: ${LOCALE_LABELS[language]} (${language})

Submission verdict: ${verdict.replace(/_/g, " ").toUpperCase()}
${VERDICT_FOCUS[verdict]}

Problem: ${problem.title}

${problem.description}

${examplesText}${constraintsText}${resultText}

Solution language: ${solution.language}
Solution (${solution.lineCount} lines):
${formatCodeBlock(solution)}

Return JSON matching this exact schema:
${SOLUTION_JSON_SCHEMA}`;
}
