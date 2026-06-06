import { useCallback, useEffect, useState } from "react";
import { sendMessage } from "@/shared/messaging";
import type { HintEngineResponse, ProblemContext } from "@/shared/types";
import { LanguageProvider } from "@/popup/hooks/useLanguage";
import { useTranslation } from "@/popup/hooks/useTranslation";
import { AppHeader } from "./components/AppHeader";
import { CoachPanel } from "./components/CoachPanel";
import { ProblemSummary } from "./components/ProblemSummary";

function AppContent() {
  const { t, locale, setLocale, ready } = useTranslation();
  const [problem, setProblem] = useState<ProblemContext | null>(null);
  const [analysis, setAnalysis] = useState<HintEngineResponse["analysis"] | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
  }, []);

  useEffect(() => {
    void loadProblem();
  }, [loadProblem]);

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

        <ProblemSummary
          problem={problem}
          analysis={analysis}
          loading={loading}
          error={error}
          onRefresh={loadProblem}
        />

        {problem && (
          <CoachPanel
            key={`${problem.url}-${locale}`}
            problem={problem}
            onAnalysis={setAnalysis}
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
