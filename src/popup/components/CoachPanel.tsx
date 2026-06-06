import { useState } from "react";
import { sendMessage } from "@/shared/messaging";
import type {
  HintEngineResponse,
  HintLevel,
  HintLevelContent,
  ProblemContext,
} from "@/shared/types";
import { withTimeout } from "@/shared/utils/timeout";
import { useTranslation } from "@/popup/hooks/useTranslation";
import { ActionButton } from "./EmptyState";
import { ResponseCard } from "./ResponseCard";
import { SkeletonLoader } from "./SkeletonLoader";
import { LoadingProgress } from "./LoadingProgress";

interface CoachPanelProps {
  problem: ProblemContext;
  onAnalysis?: (analysis: HintEngineResponse["analysis"]) => void;
}

type LoadingAction = "hint" | "pattern" | "complexity" | null;

const HINT_REQUEST_TIMEOUT_MS = 90_000;

const HINT_LEVEL_SUBLABELS: Record<HintLevel, "hintLevelAbstract" | "hintLevelSpecific" | "hintLevelDirection"> = {
  1: "hintLevelAbstract",
  2: "hintLevelSpecific",
  3: "hintLevelDirection",
};

export function CoachPanel({ problem, onAnalysis }: CoachPanelProps) {
  const { t, locale } = useTranslation();
  const [response, setResponse] = useState<HintEngineResponse | null>(null);
  const [visibleHintCount, setVisibleHintCount] = useState(0);
  const [showPattern, setShowPattern] = useState(false);
  const [showComplexity, setShowComplexity] = useState(false);
  const [loadingAction, setLoadingAction] = useState<LoadingAction>(null);
  const [error, setError] = useState<string | null>(null);

  const loading = loadingAction !== null;
  const hints = response?.hints.filter((h) => h.text.length > 0) ?? [];
  const visibleHints = hints.slice(0, visibleHintCount);
  const canRequestMoreHints = visibleHintCount < 3 && hints.length >= visibleHintCount + 1;
  const hasStarted = response !== null || visibleHintCount > 0 || showPattern || showComplexity;

  async function fetchAnalysis(action: LoadingAction) {
    if (loading) return;

    if (response) {
      applyAction(action);
      return;
    }

    setLoadingAction(action);
    setError(null);

    try {
      const result = await withTimeout(
        sendMessage<HintEngineResponse>({
          type: "GENERATE_HINTS",
          payload: {
            problem: {
              title: problem.title,
              description: problem.description,
              examples: problem.examples,
              constraints: problem.constraints,
            },
            language: locale,
          },
        }),
        HINT_REQUEST_TIMEOUT_MS,
        t("errorTimeout"),
      );

      if (!result) {
        setError(t("errorNoResponse"));
        return;
      }

      if (!result.ok) {
        setError(result.error);
        return;
      }

      const firstHint = result.data.hints.find((h) => h.level === 1 && h.text);
      if (!firstHint) {
        setError(t("errorEmptyHint"));
        return;
      }

      setResponse(result.data);
      onAnalysis?.(result.data.analysis);
      applyAction(action, result.data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("errorGeneric"),
      );
    } finally {
      setLoadingAction(null);
    }
  }

  function applyAction(action: LoadingAction, data: HintEngineResponse | null = response) {
    if (!data) return;

    if (action === "hint") {
      const nextCount = Math.min(visibleHintCount + 1, 3);
      setVisibleHintCount(nextCount);
    }
    if (action === "pattern") setShowPattern(true);
    if (action === "complexity") setShowComplexity(true);
  }

  function handleGetHint() {
    void fetchAnalysis("hint");
  }

  function handleAnalyzePattern() {
    void fetchAnalysis("pattern");
  }

  function handleComplexity() {
    void fetchAnalysis("complexity");
  }

  const loadingStages = [
    t("loadingStageRead"),
    t("loadingStageAnalyze"),
    t("loadingStageContact"),
  ];

  return (
    <div className="space-y-4">
      {!hasStarted && !loading && (
        <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-400">
            {t("actions")}
          </p>
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-4 text-center">
            <p className="text-sm font-medium text-slate-800">{t("emptyTitle")}</p>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
              {t("emptySubtitle")}
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <ActionButton
                label={t("getHint")}
                onClick={handleGetHint}
                loading={loading}
                variant="primary"
              />
              <div className="grid grid-cols-2 gap-2">
                <ActionButton
                  label={t("analyzePattern")}
                  onClick={handleAnalyzePattern}
                  loading={loading}
                />
                <ActionButton
                  label={t("complexity")}
                  onClick={handleComplexity}
                  loading={loading}
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {hasStarted && (
        <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-400">
            {t("actions")}
          </p>
          <div className="flex flex-col gap-2">
            {(canRequestMoreHints || visibleHintCount === 0) && (
              <ActionButton
                label={
                  visibleHintCount === 0 ?
                    t("getHint")
                  : t("nextHint", { level: visibleHintCount + 1 })
                }
                onClick={handleGetHint}
                loading={loading && loadingAction === "hint"}
                variant="primary"
              />
            )}
            <div className="grid grid-cols-2 gap-2">
              {!showPattern && (
                <ActionButton
                  label={t("analyzePattern")}
                  onClick={handleAnalyzePattern}
                  loading={loading && loadingAction === "pattern"}
                />
              )}
              {!showComplexity && (
                <ActionButton
                  label={t("complexity")}
                  onClick={handleComplexity}
                  loading={loading && loadingAction === "complexity"}
                />
              )}
            </div>
          </div>
        </section>
      )}

      {loading && (
        <>
          <SkeletonLoader variant={loadingAction ?? "generic"} />
          <LoadingProgress
            stages={loadingStages}
            title={
              loadingAction === "pattern" ? t("loadingPattern")
              : loadingAction === "complexity" ? t("loadingComplexity")
              : t("loadingHint")
            }
            waitingMessage={t("loadingWaiting")}
            slowMessage={t("loadingSlow")}
          />
        </>
      )}

      {error && !loading && (
        <p className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-600">
          {error}
        </p>
      )}

      {(visibleHints.length > 0 || showPattern || showComplexity) && !loading && (
        <section className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            {t("response")}
          </p>

          {showPattern && response?.analysis.pattern && (
            <ResponseCard title={t("pattern")} accent="violet">
              {response.analysis.pattern}
            </ResponseCard>
          )}

          {showComplexity && response?.analysis.complexity && (
            <ResponseCard title={t("complexityTitle")} accent="emerald">
              <dl className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <dt className="text-xs text-slate-500">{t("time")}</dt>
                  <dd className="font-medium text-slate-800">
                    {response.analysis.complexity.time}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">{t("space")}</dt>
                  <dd className="font-medium text-slate-800">
                    {response.analysis.complexity.space}
                  </dd>
                </div>
              </dl>
            </ResponseCard>
          )}

          {visibleHints.length > 0 && (
            <ResponseCard title={t("hints")} accent="blue">
              <div className="space-y-3">
                {visibleHints.map((hint) => (
                  <HintItem key={hint.level} hint={hint} />
                ))}
              </div>
            </ResponseCard>
          )}
        </section>
      )}

      {visibleHintCount === 3 && !loading && (
        <p className="text-center text-xs text-slate-400">{t("allHintsShown")}</p>
      )}
    </div>
  );
}

function HintItem({ hint }: { hint: HintLevelContent }) {
  const { t } = useTranslation();
  const sublabel = t(HINT_LEVEL_SUBLABELS[hint.level]);

  return (
    <div className="rounded-lg border border-blue-100/80 bg-white/70 p-3">
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-blue-700/80">
        {t("hintLevel", { level: hint.level })} — {sublabel}
      </p>
      <p className="text-sm text-slate-800">{hint.text}</p>
    </div>
  );
}
