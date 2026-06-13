import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
  type ReactNode,
} from "react";
import type { PendingCoachAction } from "@/shared/constants/extension-storage";
import { sendMessage } from "@/shared/messaging";
import type {
  HintEngineResponse,
  HintSession,
  HintStep,
  LearningProfile,
  ProblemContext,
  SolutionAnalysis,
  SubmissionVerdict,
} from "@/shared/types";
import { MAX_HINTS } from "@/shared/types";
import { withTimeout } from "@/shared/utils/timeout";
import type { TranslationKey } from "@/popup/locales/en";
import { useTranslation } from "@/popup/hooks/useTranslation";
import { ActionButton } from "./EmptyState";
import { ResponseCard } from "./ResponseCard";
import { SkeletonLoader } from "./SkeletonLoader";
import { LoadingProgress } from "./LoadingProgress";

interface CoachPanelProps {
  problem: ProblemContext;
  profile?: LearningProfile | null;
  initialHintSession?: HintSession | null;
  pendingAction?: PendingCoachAction | null;
  onPendingActionConsumed?: () => void;
  solutionAnalysis: SolutionAnalysis | null;
  solutionLoading: boolean;
  solutionError: string | null;
  autoAnalyzeOnSubmit: boolean;
  analysisSettingsLoading: boolean;
  onAnalyzeSolution: (force?: boolean) => void;
  onToggleAutoAnalyze: (enabled: boolean) => void;
}

export interface CoachPanelHandle {
  requestHint: () => void;
  requestReview: () => void;
}

type LoadingAction = "hint" | "review" | null;
type FeedbackSectionId = "bottlenecks" | "optimizations" | "edgeCases" | "feedback";

const HINT_REQUEST_TIMEOUT_MS = 90_000;

const VERDICT_LABEL_KEYS: Record<SubmissionVerdict, TranslationKey> = {
  accepted: "solutionVerdict_accepted",
  wrong_answer: "solutionVerdict_wrong_answer",
  tle: "solutionVerdict_tle",
  runtime_error: "solutionVerdict_runtime_error",
  compile_error: "solutionVerdict_compile_error",
};

function HintIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="mx-auto mb-2 h-8 w-8 text-brand-500"
      aria-hidden
    >
      <path d="M12 .75a8.25 8.25 0 00-4.135 15.39c.686.398 1.115 1.008 1.134 1.623a.75.75 0 00.573.74 48.507 48.507 0 003.478.397.75.75 0 00.522-1.395A6.375 6.375 0 0118.75 9V6.375c0-3.04-2.463-5.5-5.5-5.5-3.037 0-5.5 2.46-5.5 5.5v2.625c0 .621-.504 1.125-1.125 1.125H5.25A2.25 2.25 0 003 11.625v.375c0 2.9 2.35 5.25 5.25 5.25h.75v1.125c0 .621.504 1.125 1.125 1.125h1.5a.75.75 0 001.125-.659l.128-1.023A9.75 9.75 0 0012 21.75c5.385 0 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25z" />
    </svg>
  );
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={`h-4 w-4 text-slate-400 transition-transform ${expanded ? "rotate-180" : ""}`}
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function BulletList({
  items,
  markerClass = "text-slate-800",
}: {
  items: string[];
  markerClass?: string;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-slate-500">—</p>;
  }

  return (
    <ul className={`list-disc space-y-2 pl-4 text-sm leading-relaxed ${markerClass}`}>
      {items.map((item, index) => (
        <li key={`${index}-${item.slice(0, 24)}`}>{item}</li>
      ))}
    </ul>
  );
}

function FeedbackSubsection({
  title,
  accent,
  children,
}: {
  title: string;
  accent: "emerald" | "amber";
  children: ReactNode;
}) {
  const styles =
    accent === "emerald" ?
      "border-emerald-100 bg-emerald-50/50"
    : "border-amber-100 bg-amber-50/50";

  return (
    <div className={`rounded-lg border px-3 py-2.5 ${styles}`}>
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
        {title}
      </p>
      {children}
    </div>
  );
}

function ExpandableSection({
  id,
  title,
  count,
  expanded,
  onToggle,
  children,
  defaultOpenHint,
}: {
  id: FeedbackSectionId;
  title: string;
  count: number;
  expanded: boolean;
  onToggle: (id: FeedbackSectionId) => void;
  children: ReactNode;
  defaultOpenHint?: boolean;
}) {
  const { t } = useTranslation();

  return (
    <div
      className={`rounded-xl border bg-white transition-colors ${
        expanded ? "border-slate-200" : "border-slate-200/80"
      }`}
    >
      <button
        type="button"
        onClick={() => onToggle(id)}
        className="flex w-full items-center justify-between px-3.5 py-3 text-left"
        aria-expanded={expanded}
      >
        <span className="text-xs font-semibold text-slate-600">
          {title}
          {count > 0 ? ` (${count})` : ""}
        </span>
        <span className="flex items-center gap-2">
          {defaultOpenHint && !expanded && (
            <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-medium text-violet-700">
              {t("solutionRecommended")}
            </span>
          )}
          <ChevronIcon expanded={expanded} />
        </span>
      </button>
      {expanded && (
        <div className="space-y-3 border-t border-slate-100 px-3.5 py-3">{children}</div>
      )}
    </div>
  );
}

function bufferToVisibleSteps(buffer: string[], visibleCount: number): HintStep[] {
  return buffer
    .slice(0, visibleCount)
    .filter((text) => text.length > 0)
    .map((text, index) => ({ index: index + 1, text }));
}

function feedbackItemCount(analysis: SolutionAnalysis): number {
  const strengths = analysis.interviewStrengths ?? [];
  const improvements = analysis.interviewImprovements ?? [];
  if (strengths.length + improvements.length > 0) {
    return strengths.length + improvements.length;
  }
  return analysis.interviewFeedback ? 1 : 0;
}

export const CoachPanel = forwardRef<CoachPanelHandle, CoachPanelProps>(
  function CoachPanel(
    {
      problem,
      profile = null,
      initialHintSession,
      pendingAction = null,
      onPendingActionConsumed,
      solutionAnalysis,
      solutionLoading,
      solutionError,
      autoAnalyzeOnSubmit,
      analysisSettingsLoading,
      onAnalyzeSolution,
      onToggleAutoAnalyze,
    },
    ref,
  ) {
    const { t, locale } = useTranslation();
    const [hintBuffer, setHintBuffer] = useState<string[]>([]);
    const [visibleCount, setVisibleCount] = useState(0);
    const [canContinue, setCanContinue] = useState(true);
    const [loadingAction, setLoadingAction] = useState<LoadingAction>(null);
    const [hintError, setHintError] = useState<string | null>(null);
    const [sessionLoaded, setSessionLoaded] = useState(false);
    const [feedbackExpanded, setFeedbackExpanded] = useState<Set<FeedbackSectionId>>(
      new Set(["feedback"]),
    );

    const visibleHints = bufferToVisibleSteps(hintBuffer, visibleCount);
    const isLeetCode = problem.platform === "leetcode";
    const hintLoading = loadingAction === "hint";
    const reviewLoading = loadingAction === "review" || solutionLoading;
    const loading = hintLoading || reviewLoading;
    const hasBufferedHints = visibleCount < hintBuffer.length;
    const canRequestMoreHints =
      visibleCount < MAX_HINTS && (hasBufferedHints || canContinue);
    const hasStarted =
      visibleCount > 0 || solutionAnalysis !== null || reviewLoading || hintLoading;

    const persistHintSession = useCallback(
      async (buffer: string[], revealed: number, continueFlag: boolean) => {
        if (!problem.problemId) return;

        await sendMessage<HintSession>({
          type: "UPDATE_HINT_SESSION",
          payload: {
            problemId: problem.problemId,
            currentLevel: revealed,
            hints: buffer,
            canContinue: continueFlag,
            updatedAt: Date.now(),
            locale,
          },
        });
      },
      [problem.problemId, locale],
    );

    const applyHintSession = useCallback((session: HintSession | null) => {
      if (session && session.currentLevel > 0) {
        setHintBuffer(session.hints);
        setVisibleCount(session.currentLevel);
        setCanContinue(
          session.canContinue ??
            (session.currentLevel < session.hints.length ||
              session.currentLevel < MAX_HINTS),
        );
      } else {
        setHintBuffer([]);
        setVisibleCount(0);
        setCanContinue(true);
      }
      setSessionLoaded(true);
    }, []);

    useEffect(() => {
      if (!problem.problemId) {
        setSessionLoaded(true);
        return;
      }

      if (initialHintSession !== undefined) {
        applyHintSession(initialHintSession);
        return;
      }

      void (async () => {
        const result = await sendMessage<HintSession | null>({
          type: "GET_HINT_SESSION",
          payload: { problemId: problem.problemId!, locale },
        });

        if (result.ok) {
          applyHintSession(result.data);
        } else {
          setSessionLoaded(true);
        }
      })();
    }, [problem.problemId, locale, initialHintSession, applyHintSession]);

    async function handleGetHint() {
      if (hintLoading || !sessionLoaded || !canRequestMoreHints) return;

      if (hasBufferedHints) {
        const nextVisible = visibleCount + 1;
        setVisibleCount(nextVisible);
        void persistHintSession(hintBuffer, nextVisible, canContinue);
        return;
      }

      setLoadingAction("hint");
      setHintError(null);

      try {
        const previousHints =
          hintBuffer.length > 0 ?
            hintBuffer.map((text, index) => ({ index: index + 1, text }))
          : undefined;

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
              problemId: problem.problemId,
              language: locale,
              previousHints,
            },
          }),
          HINT_REQUEST_TIMEOUT_MS,
          t("errorTimeout"),
        );

        if (!result) {
          setHintError(t("errorNoResponse"));
          return;
        }

        if (!result.ok) {
          setHintError(result.error);
          return;
        }

        if (result.data.hints.length === 0 || !result.data.hints[0]?.text) {
          setHintError(t("errorEmptyHint"));
          return;
        }

        const newTexts = result.data.hints.map((hint) => hint.text);
        const mergedBuffer = [...hintBuffer, ...newTexts];
        const nextVisible = visibleCount + 1;

        setHintBuffer(mergedBuffer);
        setVisibleCount(nextVisible);
        setCanContinue(result.data.canContinue);
        void persistHintSession(mergedBuffer, nextVisible, result.data.canContinue);
      } catch (err) {
        setHintError(err instanceof Error ? err.message : t("errorGeneric"));
      } finally {
        setLoadingAction(null);
      }
    }

    function handleReviewSolution() {
      if (reviewLoading || !isLeetCode) return;
      if (solutionAnalysis) return;
      setLoadingAction("review");
      onAnalyzeSolution(false);
    }

    function handleReanalyze() {
      if (reviewLoading || !isLeetCode) return;
      setLoadingAction("review");
      onAnalyzeSolution(true);
    }

    useEffect(() => {
      if (!solutionLoading && loadingAction === "review") {
        setLoadingAction(null);
      }
    }, [solutionLoading, loadingAction]);

    useEffect(() => {
      if (!pendingAction || !sessionLoaded) return;

      if (pendingAction === "hint") {
        void handleGetHint();
      } else if (pendingAction === "review") {
        handleReviewSolution();
      }

      onPendingActionConsumed?.();
    }, [pendingAction, sessionLoaded]);

    useImperativeHandle(ref, () => ({
      requestHint: () => void handleGetHint(),
      requestReview: () => handleReviewSolution(),
    }));

    const hintLoadingStages = [
      t("loadingStageRead"),
      t("loadingStageAnalyze"),
      t("loadingStageContact"),
    ];

    const reviewLoadingStages = [
      t("solutionLoadingRead"),
      t("solutionLoadingAnalyze"),
      t("solutionLoadingContact"),
    ];

    const toggleFeedbackSection = (id: FeedbackSectionId) => {
      setFeedbackExpanded((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    };

    const strengths = solutionAnalysis?.interviewStrengths ?? [];
    const improvements = solutionAnalysis?.interviewImprovements ?? [];
    const hasStructuredFeedback = strengths.length > 0 || improvements.length > 0;
    const legacyFeedback = solutionAnalysis?.interviewFeedback?.trim();

    const modeLabel =
      solutionAnalysis?.analysisMode === "submission" && solutionAnalysis.submissionVerdict ?
        t(VERDICT_LABEL_KEYS[solutionAnalysis.submissionVerdict])
      : solutionAnalysis ?
        t("solutionModeManual")
      : null;

    const topPatternEntry =
      profile ?
        Object.entries(profile.patterns).sort((a, b) => b[1] - a[1])[0]
      : undefined;

    if (!sessionLoaded) {
      return <SkeletonLoader variant="generic" />;
    }

    return (
      <div className="space-y-4" data-coach-panel>
        {!hasStarted && !loading && (
          <section className="card">
            <p className="mb-3 section-title">{t("actions")}</p>
            <div className="text-center">
              <HintIcon />
              <p className="text-sm font-medium text-slate-800">{t("emptyTitle")}</p>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
                {t("emptySubtitle")}
              </p>
              {isLeetCode && (
                <p className="mt-3 rounded-lg border border-brand-100 bg-brand-50/60 px-3 py-2.5 text-xs leading-relaxed text-brand-900">
                  {t("contextMenuHint")}
                </p>
              )}
              {initialHintSession && initialHintSession.currentLevel > 0 && (
                <p className="mt-3 rounded-lg border border-blue-100 bg-blue-50/60 px-3 py-2.5 text-xs leading-relaxed text-blue-900">
                  {t("coachResumeHint", {
                    current: initialHintSession.currentLevel,
                    max: MAX_HINTS,
                  })}
                </p>
              )}
              {topPatternEntry && (
                <p className="mt-2 text-xs text-slate-500">
                  {t("coachTopPattern", {
                    pattern: topPatternEntry[0],
                    count: topPatternEntry[1],
                  })}
                </p>
              )}
            </div>
          </section>
        )}

        {hasStarted && (
          <section className="card">
            <p className="mb-3 section-title">{t("actions")}</p>
            <div className="flex flex-col gap-2">
              {canRequestMoreHints && (
                <ActionButton
                  label={visibleCount === 0 ? t("getHint") : t("nextHint")}
                  onClick={() => void handleGetHint()}
                  loading={hintLoading}
                  variant="primary"
                />
              )}
              {isLeetCode && !solutionAnalysis && (
                <ActionButton
                  label={t("reviewSolution")}
                  onClick={handleReviewSolution}
                  loading={reviewLoading && loadingAction === "review"}
                />
              )}
              {isLeetCode && solutionAnalysis && (
                <ActionButton
                  label={t("solutionReanalyze")}
                  onClick={handleReanalyze}
                  loading={reviewLoading && loadingAction === "review"}
                />
              )}
            </div>

            {isLeetCode && (
              <label className="mt-3 flex cursor-pointer items-center gap-2.5 rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2.5 transition hover:border-slate-200">
                <input
                  type="checkbox"
                  checked={autoAnalyzeOnSubmit}
                  disabled={analysisSettingsLoading}
                  onChange={(event) => onToggleAutoAnalyze(event.target.checked)}
                  className="h-3.5 w-3.5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                <span className="text-xs leading-snug text-slate-600">
                  {t("solutionAutoAnalyzeOnSubmit")}
                </span>
              </label>
            )}
          </section>
        )}

        {visibleCount > 0 && !solutionAnalysis && canContinue && !loading && (
          <p className="text-center text-xs text-slate-500">{t("nextStepReview")}</p>
        )}

        {!canContinue && visibleCount > 0 && !loading && (
          <p className="text-center text-xs text-slate-400">{t("allHintsShown")}</p>
        )}

        {hintLoading && (
          <>
            <SkeletonLoader variant="generic" />
            <LoadingProgress
              stages={hintLoadingStages}
              title={t("loadingHint")}
              waitingMessage={t("loadingWaiting")}
              slowMessage={t("loadingSlow")}
            />
          </>
        )}

        {reviewLoading && loadingAction === "review" && (
          <>
            <SkeletonLoader variant="generic" />
            <LoadingProgress
              stages={reviewLoadingStages}
              title={t("solutionLoading")}
              waitingMessage={t("loadingWaiting")}
              slowMessage={t("loadingSlow")}
            />
          </>
        )}

        {hintError && !hintLoading && (
          <p className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-600">
            {hintError}
          </p>
        )}

        {solutionError && !reviewLoading && (
          <p className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-600">
            {solutionError}
          </p>
        )}

        {(visibleCount > 0 || solutionAnalysis) && !hintLoading && (
          <section className="space-y-3">
            <p className="section-title">{t("response")}</p>

            {visibleHints.length > 0 && (
              <ResponseCard title={t("hints")} accent="blue">
                <div className="space-y-3">
                  {visibleHints.map((hint) => (
                    <HintItem key={hint.index} hint={hint} />
                  ))}
                </div>
              </ResponseCard>
            )}

            {solutionAnalysis && !reviewLoading && (
              <div className="space-y-2.5">
                {(modeLabel || solutionAnalysis.cached) && (
                  <div className="flex flex-wrap justify-end gap-1">
                    {modeLabel && (
                      <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-medium text-violet-700">
                        {modeLabel}
                      </span>
                    )}
                    {solutionAnalysis.cached && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                        {t("solutionCached")}
                      </span>
                    )}
                  </div>
                )}

                <ResponseCard title={t("solutionYourCode")} accent="violet">
                  <p className="font-medium leading-snug text-slate-800">
                    {solutionAnalysis.pattern}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-100 bg-white/80 px-2.5 py-1 text-xs">
                      <span className="text-slate-500">{t("time")}</span>
                      <span className="font-semibold text-slate-800">
                        {solutionAnalysis.timeComplexity}
                      </span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-100 bg-white/80 px-2.5 py-1 text-xs">
                      <span className="text-slate-500">{t("space")}</span>
                      <span className="font-semibold text-slate-800">
                        {solutionAnalysis.spaceComplexity}
                      </span>
                    </span>
                  </div>
                </ResponseCard>

                <ExpandableSection
                  id="feedback"
                  title={t("solutionInterviewFeedback")}
                  count={feedbackItemCount(solutionAnalysis)}
                  expanded={feedbackExpanded.has("feedback")}
                  onToggle={toggleFeedbackSection}
                  defaultOpenHint
                >
                  {hasStructuredFeedback ?
                    <div className="space-y-2.5">
                      {strengths.length > 0 && (
                        <FeedbackSubsection title={t("solutionStrengths")} accent="emerald">
                          <BulletList items={strengths} markerClass="text-emerald-950" />
                        </FeedbackSubsection>
                      )}
                      {improvements.length > 0 && (
                        <FeedbackSubsection
                          title={t("solutionImprovements")}
                          accent="amber"
                        >
                          <BulletList items={improvements} markerClass="text-amber-950" />
                        </FeedbackSubsection>
                      )}
                    </div>
                  : legacyFeedback ?
                    <div className="space-y-2">
                      <p className="text-sm leading-relaxed text-slate-800">{legacyFeedback}</p>
                      <p className="text-[11px] text-slate-400">{t("solutionLegacyFeedback")}</p>
                    </div>
                  : <p className="text-sm text-slate-500">—</p>}
                </ExpandableSection>

                <ExpandableSection
                  id="bottlenecks"
                  title={t("solutionBottlenecks")}
                  count={solutionAnalysis.bottlenecks.length}
                  expanded={feedbackExpanded.has("bottlenecks")}
                  onToggle={toggleFeedbackSection}
                >
                  <BulletList items={solutionAnalysis.bottlenecks} />
                </ExpandableSection>

                <ExpandableSection
                  id="optimizations"
                  title={t("solutionOptimizations")}
                  count={solutionAnalysis.optimizations.length}
                  expanded={feedbackExpanded.has("optimizations")}
                  onToggle={toggleFeedbackSection}
                >
                  <BulletList items={solutionAnalysis.optimizations} />
                </ExpandableSection>

                <ExpandableSection
                  id="edgeCases"
                  title={t("solutionEdgeCases")}
                  count={solutionAnalysis.missedEdgeCases.length}
                  expanded={feedbackExpanded.has("edgeCases")}
                  onToggle={toggleFeedbackSection}
                >
                  <BulletList items={solutionAnalysis.missedEdgeCases} />
                </ExpandableSection>
              </div>
            )}
          </section>
        )}
      </div>
    );
  },
);

function HintItem({ hint }: { hint: HintStep }) {
  const { t } = useTranslation();

  return (
    <div className="hint-reveal rounded-lg border border-blue-100/80 bg-white/70 p-3">
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-blue-700/80">
        {t("hintLevel", { level: hint.index })}
      </p>
      <p className="text-sm text-slate-800">{hint.text}</p>
    </div>
  );
}
