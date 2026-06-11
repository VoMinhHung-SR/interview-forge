import type { HintEngineJsonPayload, MentorMeta } from "@/shared/types/hints";

const CODE_FENCE_PATTERN = /```/;
const FUNCTION_PATTERN =
  /\b(function\s+\w+|def\s+\w+|class\s+Solution|public\s+\w+\s+\w+\s*\(|const\s+\w+\s*=\s*\([^)]*\)\s*=>)/i;
const IMPLEMENTATION_STEPS_PATTERN =
  /\b(step\s+\d+|first,?\s+(initialize|create|loop|return)|then,?\s+(iterate|check|return))/i;
const FULL_SOLUTION_PHRASES = [
  /here(?:'s| is) (?:the|a) (?:complete|full) solution/i,
  /solution code/i,
];

export interface GuardrailResult {
  passed: boolean;
  violations: string[];
}

/**
 * Validates a single hint does not leak a solution.
 */
export function validateHintText(text: string): GuardrailResult {
  const violations: string[] = [];

  if (CODE_FENCE_PATTERN.test(text)) {
    violations.push("Contains code block");
  }
  if (FUNCTION_PATTERN.test(text)) {
    violations.push("Contains function or class implementation");
  }
  if (IMPLEMENTATION_STEPS_PATTERN.test(text)) {
    violations.push("Contains step-by-step implementation");
  }
  for (const pattern of FULL_SOLUTION_PHRASES) {
    if (pattern.test(text)) {
      violations.push("Contains solution-revealing phrase");
    }
  }

  return { passed: violations.length === 0, violations };
}

/**
 * Validates the hint in an AI response payload.
 */
export function validateHintPayload(
  payload: HintEngineJsonPayload,
): GuardrailResult {
  const hint = payload.hint?.trim() ?? "";
  if (!hint) {
    return { passed: false, violations: ["Empty hint"] };
  }

  const result = validateHintText(hint);
  return {
    passed: result.passed,
    violations: result.violations.map((v) => `Hint: ${v}`),
  };
}

export function normalizeMetaPayload(
  payload: HintEngineJsonPayload,
  isFirstHint: boolean,
): MentorMeta {
  return {
    pattern: isFirstHint ? payload.pattern?.trim() || "Unknown" : "",
    difficulty: isFirstHint ? payload.difficulty?.trim() || "Unknown" : "",
  };
}

/**
 * Strips markdown fences and extracts JSON from a raw AI response string.
 */
export function extractJsonFromResponse(raw: string): string {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced?.[1]) return fenced[1].trim();

  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start !== -1 && end !== -1) return raw.slice(start, end + 1);

  return raw.trim();
}

function isHintEngineJsonPayload(value: unknown): value is HintEngineJsonPayload {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return typeof record.hint === "string";
}

/**
 * Parses and validates the AI response into a typed JSON payload.
 */
export function parseHintResponse(raw: string): HintEngineJsonPayload {
  const jsonText = extractJsonFromResponse(raw);
  const parsed: unknown = JSON.parse(jsonText);

  if (!isHintEngineJsonPayload(parsed)) {
    throw new Error("AI response does not match HintEngineJsonPayload schema");
  }

  if (!parsed.hint?.trim()) {
    throw new Error("AI response contains an empty hint");
  }

  return parsed;
}
