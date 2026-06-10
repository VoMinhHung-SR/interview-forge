import { useCallback, useEffect, useState } from "react";
import { sendMessage } from "@/shared/messaging";
import type { ProblemContext } from "@/shared/types";
import { LanguageProvider } from "@/popup/hooks/useLanguage";
import { usePersistence } from "@/popup/hooks/usePersistence";
import { useTranslation } from "@/popup/hooks/useTranslation";
import { AppHeader } from "./components/AppHeader";
import { CoachPanel } from "./components/CoachPanel";
import { PersistencePanel } from "./components/PersistencePanel";
import { ProblemHubPanel } from "./components/ProblemHubPanel";
import { SolutionAnalysisPanel } from "./components/SolutionAnalysisPanel";
import { useSolutionAnalysis } from "./hooks/useSolutionAnalysis";

function AppContent() {
  const { t, locale, setLocale, ready } = useTranslation();
  const { recent, saved, profile, refresh, loading: persistenceLoading } =
    usePersistence();
  const [problem, setProblem] = useState<ProblemContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const {
    analysis: solutionAnalysis,
    loading: solutionLoading,
    error: solutionError,
    analyze: analyzeSolution,
    settings: analysisSettings,
    settingsLoading: analysisSettingsLoading,
    toggleAutoAnalyze,
  } = useSolutionAnalysis({
    problemId: problem?.problemId,
    locale,
  });

  const loadProblem = useCallback(async () => {
    setLoading(true);
    setError(null);

    const response = await sendMessage<ProblemContext | null>({
      type: "GET_PROBLEM_CONTEXT",
    });

    setLoading(false);

    if (!response.ok) {
      setError(response.error);
      setProblem(null);
      return;
    }

    setProblem(response.data);
    void refresh();
  }, [refresh]);

  useEffect(() => {
    void loadProblem();
  }, [loadProblem]);

  const isCurrentSaved =
    problem?.problemId ?
      saved.some((item) => item.problemId === problem.problemId)
    : false;

  const handleToggleSave = useCallback(async () => {
    if (!problem?.problemId) return;

    setSaveLoading(true);

    if (isCurrentSaved) {
      await sendMessage({
        type: "UNSAVE_PROBLEM",
        payload: { problemId: problem.problemId },
      });
    } else {
      await sendMessage({
        type: "SAVE_PROBLEM",
        payload: {
          problemId: problem.problemId,
          title: problem.title,
          difficulty: problem.difficulty,
          platform: problem.platform,
          url: problem.url,
        },
      });
    }

    await refresh();
    setSaveLoading(false);
  }, [problem, isCurrentSaved, refresh]);

  const handleUnsave = useCallback(
    async (problemId: string) => {
      await sendMessage({
        type: "UNSAVE_PROBLEM",
        payload: { problemId },
      });
      await refresh();
    },
    [refresh],
  );

  if (!ready) {
    return (
      <div className="w-[26rem] bg-slate-50 p-4">
        <div className="skeleton h-16 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="w-[26rem] bg-slate-50 p-4">
      <div className="space-y-4">
        <AppHeader locale={locale} onLocaleChange={setLocale} />

        <ProblemHubPanel
          problem={problem}
          problemLoading={loading}
          problemError={error}
          onRefreshProblem={loadProblem}
          isSaved={isCurrentSaved}
          onToggleSave={() => void handleToggleSave()}
          saveLoading={saveLoading}
          recent={recent}
          recentLoading={persistenceLoading}
        />

        <PersistencePanel
          saved={saved}
          profile={profile}
          loading={persistenceLoading}
          onUnsave={(problemId) => void handleUnsave(problemId)}
        />

        {problem && (
          <CoachPanel
            key={`${problem.url}-${locale}`}
            problem={problem}
          />
        )}

        {problem && (
          <SolutionAnalysisPanel
            problem={problem}
            analysis={solutionAnalysis}
            loading={solutionLoading}
            error={solutionError}
            autoAnalyzeOnSubmit={analysisSettings.autoAnalyzeOnSubmit}
            settingsLoading={analysisSettingsLoading}
            onAnalyze={(force) => void analyzeSolution(force)}
            onToggleAutoAnalyze={(enabled) => void toggleAutoAnalyze(enabled)}
          />
        )}

        {!problem && !loading && !error && (
          <p className="text-center text-xs text-slate-400">{t("noProblem")}</p>
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}
