import type {
  AppLocale,
  HintEngineJsonPayload,
  HintLevel,
  HintLevelContent,
  MentorAnalysis,
} from "@/shared/types/hints";
import { HINT_LEVEL_LABELS } from "@/shared/types/hints";

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

function hintEntries(payload: HintEngineJsonPayload): Array<{
  level: HintLevel;
  text: string;
}> {
  if (
    Array.isArray(payload.hints) &&
    payload.hints.length > 0 &&
    typeof payload.hints[0] === "string"
  ) {
    return (payload.hints as string[])
      .slice(0, 3)
      .map((text, index) => ({
        level: (index + 1) as HintLevel,
        text: text.trim(),
      }))
      .filter((h) => h.text.length > 0);
  }

  return (payload.hints as Array<{ level: HintLevel; text: string }>)
    .filter((h) => [1, 2, 3].includes(h.level))
    .map((h) => ({ level: h.level, text: h.text.trim() }));
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
 * Validates all hints in an AI response payload.
 */
export function validateHintPayload(
  payload: HintEngineJsonPayload,
): GuardrailResult {
  const violations: string[] = [];

  for (const hint of hintEntries(payload)) {
    const result = validateHintText(hint.text);
    violations.push(...result.violations.map((v) => `Level ${hint.level}: ${v}`));
  }

  return { passed: violations.length === 0, violations };
}

function normalizeLocale(value: string | undefined): AppLocale {
  return value?.toLowerCase().startsWith("vi") ? "vi" : "en";
}

/**
 * Normalizes raw AI JSON into strongly typed hint content.
 */
export function normalizeHintPayload(
  payload: HintEngineJsonPayload,
): HintLevelContent[] {
  return hintEntries(payload)
    .sort((a, b) => a.level - b.level)
    .map((h) => ({
      level: h.level,
      label: HINT_LEVEL_LABELS[h.level],
      text: h.text,
    }));
}

export function normalizeAnalysisPayload(
  payload: HintEngineJsonPayload,
  fallbackLocale: AppLocale = "en",
): MentorAnalysis {
  return {
    language: normalizeLocale(payload.language ?? fallbackLocale),
    pattern: payload.pattern?.trim() || "Unknown",
    difficulty: payload.difficulty?.trim() || "Unknown",
    summary: payload.summary?.trim() || "",
    complexity: {
      time: payload.complexity?.time?.trim() || "—",
      space: payload.complexity?.space?.trim() || "—",
    },
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

function isHintArray(value: unknown): boolean {
  if (!Array.isArray(value) || value.length === 0) return false;
  return value.every(
    (item) =>
      typeof item === "string" ||
      (typeof item === "object" &&
        item !== null &&
        typeof (item as Record<string, unknown>).text === "string" &&
        [1, 2, 3].includes((item as Record<string, unknown>).level as number)),
  );
}

function isHintEngineJsonPayload(value: unknown): value is HintEngineJsonPayload {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return isHintArray(record.hints);
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

  const entries = hintEntries(parsed);
  if (entries.length === 0) {
    throw new Error("AI response contains no hints");
  }

  return parsed;
}
