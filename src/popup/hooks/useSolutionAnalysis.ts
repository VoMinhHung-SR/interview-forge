import { useCallback, useEffect, useState } from "react";
import { sendMessage } from "@/shared/messaging";
import type { AppLocale, SolutionAnalysis } from "@/shared/types";
import { withTimeout } from "@/shared/utils/timeout";

const ANALYSIS_TIMEOUT_MS = 90_000;

interface UseSolutionAnalysisOptions {
  problemId?: string;
  locale: AppLocale;
}

export function useSolutionAnalysis({
  problemId,
  locale,
}: UseSolutionAnalysisOptions) {
  const [analysis, setAnalysis] = useState<SolutionAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCached = useCallback(async () => {
    if (!problemId) {
      setAnalysis(null);
      return;
    }

    const result = await sendMessage<SolutionAnalysis | null>({
      type: "GET_SOLUTION_ANALYSIS",
      payload: { problemId },
    });

    if (result.ok) {
      setAnalysis(result.data);
    }
  }, [problemId]);

  useEffect(() => {
    void loadCached();
  }, [loadCached]);

  const analyze = useCallback(
    async (force = false) => {
      if (!problemId || loading) return;

      setLoading(true);
      setError(null);

      try {
        const result = await withTimeout(
          sendMessage<SolutionAnalysis>({
            type: "ANALYZE_SOLUTION",
            payload: { language: locale, force },
          }),
          ANALYSIS_TIMEOUT_MS,
          "Request timed out. Gemini may be rate-limited — wait a minute and retry.",
        );

        if (!result) {
          setError("No response from extension. Reload and try again.");
          return;
        }

        if (!result.ok) {
          setError(result.error);
          return;
        }

        setAnalysis(result.data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Something went wrong while analyzing.",
        );
      } finally {
        setLoading(false);
      }
    },
    [problemId, locale, loading],
  );

  return {
    analysis,
    loading,
    error,
    analyze,
    refreshCached: loadCached,
  };
}
