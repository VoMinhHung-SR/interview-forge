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

function normalizeHintStrings(payload: HintEngineJsonPayload): string[] {
  if (!Array.isArray(payload.hints)) return [];
  return payload.hints
    .filter((item): item is string => typeof item === "string")
    .map((text) => text.trim())
    .filter((text) => text.length > 0);
}

/**
 * Validates all hints in an AI response payload.
 */
export function validateHintPayload(
  payload: HintEngineJsonPayload,
  expectedCount: number,
): GuardrailResult {
  const hints = normalizeHintStrings(payload);
  const violations: string[] = [];

  if (hints.length === 0) {
    violations.push("Empty hints array");
  }
  if (hints.length !== expectedCount) {
    violations.push(`Expected ${expectedCount} hint(s), got ${hints.length}`);
  }

  for (let i = 0; i < hints.length; i++) {
    const result = validateHintText(hints[i]);
    violations.push(...result.violations.map((v) => `Hint ${i + 1}: ${v}`));
  }

  return { passed: violations.length === 0, violations };
}

export function extractHintStrings(payload: HintEngineJsonPayload): string[] {
  return normalizeHintStrings(payload);
}

export function normalizeMetaPayload(
  payload: HintEngineJsonPayload,
  isFirstBatch: boolean,
): MentorMeta {
  return {
    pattern: isFirstBatch ? payload.pattern?.trim() || "Unknown" : "",
    difficulty: isFirstBatch ? payload.difficulty?.trim() || "Unknown" : "",
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
  return Array.isArray(record.hints);
}

/**
 * Parses and validates the AI response into a typed JSON payload.
 */
export function parseHintResponse(
  raw: string,
  expectedCount: number,
): HintEngineJsonPayload {
  const jsonText = extractJsonFromResponse(raw);
  const parsed: unknown = JSON.parse(jsonText);

  if (!isHintEngineJsonPayload(parsed)) {
    throw new Error("AI response does not match HintEngineJsonPayload schema");
  }

  const hints = normalizeHintStrings(parsed);
  if (hints.length !== expectedCount) {
    throw new Error(`AI response contains ${hints.length} hints, expected ${expectedCount}`);
  }

  return parsed;
}
