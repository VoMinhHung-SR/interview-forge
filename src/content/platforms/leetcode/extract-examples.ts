import type { ProblemExample } from "@/shared/types";

const EXAMPLE_BLOCK_PATTERN =
  /Example\s+(\d+)\s*:\s*([\s\S]*?)(?=Example\s+\d+\s*:|Constraints\s*:|Follow[\s-]?up\s*:|$)/gi;

const INPUT_PATTERN = /Input\s*:\s*([\s\S]*?)(?=Output\s*:|$)/i;
const OUTPUT_PATTERN = /Output\s*:\s*([\s\S]*?)(?=Explanation\s*:|Example\s+\d+\s*:|Constraints\s*:|$)/i;
const EXPLANATION_PATTERN =
  /Explanation\s*:\s*([\s\S]*?)(?=Example\s+\d+\s*:|Constraints\s*:|Follow[\s-]?up\s*:|$)/i;

/**
 * Parses structured examples from LeetCode description text.
 */
export function extractExamples(descriptionText: string): ProblemExample[] {
  const examples: ProblemExample[] = [];
  EXAMPLE_BLOCK_PATTERN.lastIndex = 0;

  let match: RegExpExecArray | null;
  while ((match = EXAMPLE_BLOCK_PATTERN.exec(descriptionText)) !== null) {
    const block = match[2]?.trim();
    if (!block) continue;

    const parsed = parseExampleBlock(block);
    if (parsed) examples.push(parsed);
  }

  if (examples.length > 0) return examples;

  return extractExamplesWithoutHeaders(descriptionText);
}

function parseExampleBlock(block: string): ProblemExample | null {
  const inputMatch = block.match(INPUT_PATTERN);
  const outputMatch = block.match(OUTPUT_PATTERN);
  if (!inputMatch?.[1] || !outputMatch?.[1]) return null;

  const explanationMatch = block.match(EXPLANATION_PATTERN);

  return {
    input: inputMatch[1].trim(),
    output: outputMatch[1].trim(),
    ...(explanationMatch?.[1]
      ? { explanation: explanationMatch[1].trim() }
      : {}),
  };
}

/** Fallback when examples omit the "Example N:" header but include Input/Output pairs. */
function extractExamplesWithoutHeaders(text: string): ProblemExample[] {
  const examples: ProblemExample[] = [];
  const pairPattern =
    /Input\s*:\s*([\s\S]*?)\s*Output\s*:\s*([\s\S]*?)(?=(?:\s*Explanation\s*:|Input\s*:|Constraints\s*:|Follow[\s-]?up\s*:|$))/gi;

  let match: RegExpExecArray | null;
  while ((match = pairPattern.exec(text)) !== null) {
    const input = match[1]?.trim();
    const outputAndRest = match[2]?.trim();
    if (!input || !outputAndRest) continue;

    const explanationMatch = outputAndRest.match(
      /^([\s\S]*?)(?:\s*Explanation\s*:\s*([\s\S]*))?$/,
    );
    const output = explanationMatch?.[1]?.trim() ?? outputAndRest;
    const explanation = explanationMatch?.[2]?.trim();

    examples.push({
      input,
      output,
      ...(explanation ? { explanation } : {}),
    });
  }

  return examples;
}
