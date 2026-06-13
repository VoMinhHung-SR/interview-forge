import { useCallback, useEffect, useRef, useState } from "react";
import {
  PENDING_COACH_ACTION_KEY,
  type PendingCoachAction,
} from "@/shared/constants/extension-storage";
import { sendMessage } from "@/shared/messaging";
import { LanguageProvider } from "@/popup/hooks/useLanguage";
import { usePopupInit } from "@/popup/hooks/usePopupInit";
import { useSolutionAnalysis } from "@/popup/hooks/useSolutionAnalysis";
import { useTranslation } from "@/popup/hooks/useTranslation";
import { AppHeader } from "./components/AppHeader";
import { CoachPanel, type CoachPanelHandle } from "./components/CoachPanel";
import { PersistencePanel } from "./components/PersistencePanel";
import { ProblemHubPanel } from "./components/ProblemHubPanel";
import { StickyActionBar } from "./components/StickyActionBar";

function AppContent() {
  const { t, locale, setLocale, ready } = useTranslation();
  const {
    problem,
    recent,
    saved,
    profile,
    hintSession,
    analysis: initialAnalysis,
    analysisSettings: initialAnalysisSettings,
    translation,
    loading,
    error,
    reload,
    refreshPersistence,
  } = usePopupInit(locale);

  const [saveLoading, setSaveLoading] = useState(false);
  const [stickyVisible, setStickyVisible] = useState(false);
  const [pendingCoachAction, setPendingCoachAction] =
    useState<PendingCoachAction | null>(null);
  const coachRef = useRef<CoachPanelHandle>(null);
  const coachSentinelRef = useRef<HTMLDivElement>(null);

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
    initialAnalysis,
    initialSettings: initialAnalysisSettings,
  });

  useEffect(() => {
    void chrome.storage.session.get(PENDING_COACH_ACTION_KEY).then((result) => {
      const action = result[PENDING_COACH_ACTION_KEY];
      if (action === "hint" || action === "review") {
        setPendingCoachAction(action);
        void chrome.storage.session.remove(PENDING_COACH_ACTION_KEY);
      }
    });
  }, []);

  useEffect(() => {
    const sentinel = coachSentinelRef.current;
    if (!sentinel || !problem) {
      setStickyVisible(false);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => setStickyVisible(!entry.isIntersecting),
      { threshold: 0, rootMargin: "-8px 0px 0px 0px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [problem]);

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

    await refreshPersistence();
    setSaveLoading(false);
  }, [problem, isCurrentSaved, refreshPersistence]);

  const handleUnsave = useCallback(
    async (problemId: string) => {
      await sendMessage({
        type: "UNSAVE_PROBLEM",
        payload: { problemId },
      });
      await refreshPersistence();
    },
    [refreshPersistence],
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
      {problem && (
        <StickyActionBar
          problemTitle={problem.title}
          visible={stickyVisible}
          onGetHint={() => coachRef.current?.requestHint()}
        />
      )}

      <div className="space-y-4">
        <AppHeader locale={locale} onLocaleChange={setLocale} />

        <ProblemHubPanel
          problem={problem}
          problemLoading={loading}
          problemError={error}
          onRefreshProblem={() => void reload()}
          isSaved={isCurrentSaved}
          onToggleSave={() => void handleToggleSave()}
          saveLoading={saveLoading}
          recent={recent}
          recentLoading={loading}
          initialTranslation={translation}
        />

        <PersistencePanel
          saved={saved}
          profile={profile}
          loading={loading}
          onUnsave={(problemId) => void handleUnsave(problemId)}
        />

        {problem && (
          <>
            <div ref={coachSentinelRef} aria-hidden className="h-0" />
            <CoachPanel
              ref={coachRef}
              key={`${problem.url}-${locale}`}
              problem={problem}
              profile={profile}
              initialHintSession={hintSession}
              pendingAction={pendingCoachAction}
              onPendingActionConsumed={() => setPendingCoachAction(null)}
              solutionAnalysis={solutionAnalysis}
              solutionLoading={solutionLoading}
              solutionError={solutionError}
              autoAnalyzeOnSubmit={analysisSettings.autoAnalyzeOnSubmit}
              analysisSettingsLoading={analysisSettingsLoading}
              onAnalyzeSolution={(force) => void analyzeSolution(force)}
              onToggleAutoAnalyze={(enabled) => void toggleAutoAnalyze(enabled)}
            />
          </>
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
