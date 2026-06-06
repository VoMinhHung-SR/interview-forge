import { useState } from "react";
import { sendMessage } from "@/shared/messaging";
import type {
  HintEngineResponse,
  HintLevel,
  HintLevelContent,
  ProblemContext,
} from "@/shared/types";
import { withTimeout } from "@/shared/utils/timeout";
import { LoadingProgress } from "./LoadingProgress";

interface HintPanelProps {
  problem: ProblemContext;
}

const LEVEL_LABELS: Record<HintLevel, string> = {
  1: "Level 1 — Abstract",
  2: "Level 2 — Specific",
  3: "Level 3 — Direction",
};

const HINT_LOADING_STAGES: Record<HintLevel, string[]> = {
  1: [
    "Reading problem description…",
    "Asking AI for an abstract hint…",
    "Contacting Gemini…",
  ],
  2: [
    "Reviewing your previous hint…",
    "Generating a more specific nudge…",
    "Contacting Gemini…",
  ],
  3: [
    "Reviewing problem patterns…",
    "Suggesting an approach direction…",
    "Contacting Gemini…",
  ],
};

const HINT_REQUEST_TIMEOUT_MS = 90_000;

export function HintPanel({ problem }: HintPanelProps) {
  const [hints, setHints] = useState<HintLevelContent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nextLevel = (hints.length + 1) as HintLevel;
  const canRequestMore = hints.length < 3;

  async function requestHint() {
    if (!canRequestMore || loading) return;

    setLoading(true);
    setError(null);

    try {
      const response = await withTimeout(
        sendMessage<HintEngineResponse>({
          type: "GENERATE_HINTS",
          payload: {
            problem: {
              title: problem.title,
              description: problem.description,
              examples: problem.examples,
              constraints: problem.constraints,
            },
            level: nextLevel,
            previousHints: hints.length > 0 ? hints : undefined,
          },
        }),
        HINT_REQUEST_TIMEOUT_MS,
        "Hint request timed out. Gemini may be rate-limited — wait a minute and retry.",
      );

      if (!response) {
        setError(
          "No response from extension. Reload the extension in chrome://extensions and try again.",
        );
        return;
      }

      if (!response.ok) {
        setError(response.error);
        return;
      }

      const newHint = response.data.hints.find((h) => h.level === nextLevel);
      if (newHint?.text) {
        setHints((prev) => [...prev, newHint]);
        return;
      }

      setError("AI returned an empty hint. Please try again.");
    } catch (err) {
      setError(
        err instanceof Error ?
          err.message
        : "Something went wrong while generating the hint.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      {hints.map((hint) => (
        <div
          key={hint.level}
          className="rounded-lg border border-slate-200 bg-slate-50 p-3"
        >
          <p className="mb-1 text-xs font-medium text-slate-500">
            {LEVEL_LABELS[hint.level]}
          </p>
          <p className="text-sm text-slate-800">{hint.text}</p>
        </div>
      ))}

      {loading && (
        <LoadingProgress stages={HINT_LOADING_STAGES[nextLevel]} />
      )}

      {error && !loading && (
        <p className="rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-600">
          {error}
        </p>
      )}

      {canRequestMore && (
        <button
          type="button"
          onClick={requestHint}
          disabled={loading}
          className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ?
            "Generating…"
          : hints.length === 0 ?
            "Give Hint"
          : `Next Hint (Level ${nextLevel})`}
        </button>
      )}

      {hints.length === 3 && !loading && (
        <p className="text-center text-xs text-slate-400">
          All hint levels shown. Try solving from here!
        </p>
      )}
    </div>
  );
}
