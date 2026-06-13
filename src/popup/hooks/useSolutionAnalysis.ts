import { useCallback, useEffect, useState } from "react";
import { STORAGE_KEYS } from "@/shared/constants/storage-keys";
import { sendMessage } from "@/shared/messaging";
import type {
  AnalysisSettings,
  AppLocale,
  SolutionAnalysis,
} from "@/shared/types";
import { withTimeout } from "@/shared/utils/timeout";

const ANALYSIS_TIMEOUT_MS = 90_000;

interface UseSolutionAnalysisOptions {
  problemId?: string;
  locale: AppLocale;
  initialAnalysis?: SolutionAnalysis | null;
  initialSettings?: AnalysisSettings;
}

export function useSolutionAnalysis({
  problemId,
  locale,
  initialAnalysis = null,
  initialSettings,
}: UseSolutionAnalysisOptions) {
  const [analysis, setAnalysis] = useState<SolutionAnalysis | null>(initialAnalysis);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<AnalysisSettings>(
    initialSettings ?? { autoAnalyzeOnSubmit: false },
  );
  const [settingsLoading, setSettingsLoading] = useState(!initialSettings);

  useEffect(() => {
    setAnalysis(initialAnalysis);
  }, [initialAnalysis, problemId]);

  useEffect(() => {
    if (initialSettings) {
      setSettings(initialSettings);
      setSettingsLoading(false);
    }
  }, [initialSettings]);

  const loadSettings = useCallback(async () => {
    if (initialSettings) return;

    setSettingsLoading(true);
    const result = await sendMessage<AnalysisSettings>({
      type: "GET_ANALYSIS_SETTINGS",
    });
    if (result.ok) {
      setSettings(result.data);
    }
    setSettingsLoading(false);
  }, [initialSettings]);

  const loadCached = useCallback(async () => {
    if (!problemId) {
      setAnalysis(null);
      return;
    }

    await sendMessage({ type: "CLEAR_ANALYSIS_BADGE" });

    const result = await sendMessage<SolutionAnalysis | null>({
      type: "GET_SOLUTION_ANALYSIS",
      payload: { problemId },
    });

    if (result.ok) {
      setAnalysis(result.data);
    }
  }, [problemId]);

  useEffect(() => {
    if (!initialSettings) {
      void loadSettings();
    }
  }, [loadSettings, initialSettings]);

  useEffect(() => {
    if (!problemId || initialAnalysis) return;
    void loadCached();
  }, [loadCached, problemId, initialAnalysis]);

  useEffect(() => {
    if (!problemId) return;

    const latestKey = STORAGE_KEYS.solutionLatest(problemId);

    const onStorageChanged = (
      changes: Record<string, chrome.storage.StorageChange>,
      area: string,
    ) => {
      if (area !== "local" || !changes[latestKey]) return;
      void loadCached();
    };

    chrome.storage.onChanged.addListener(onStorageChanged);
    return () => chrome.storage.onChanged.removeListener(onStorageChanged);
  }, [problemId, loadCached]);

  const toggleAutoAnalyze = useCallback(async (enabled: boolean) => {
    const result = await sendMessage<AnalysisSettings>({
      type: "SET_ANALYSIS_SETTINGS",
      payload: { autoAnalyzeOnSubmit: enabled },
    });
    if (result.ok) {
      setSettings(result.data);
    }
  }, []);

  const analyze = useCallback(
    async (force = false) => {
      if (!problemId || loading) return;
      if (!force && analysis) return;

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
    [problemId, locale, loading, analysis],
  );

  return {
    analysis,
    loading,
    error,
    analyze,
    refreshCached: loadCached,
    settings,
    settingsLoading,
    toggleAutoAnalyze,
    setSettings,
  };
}
