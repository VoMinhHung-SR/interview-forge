import { useEffect, useState, type ReactNode } from "react";
import type { ProblemContext, SolutionAnalysis, SubmissionVerdict } from "@/shared/types";
import type { TranslationKey } from "@/popup/locales/en";
import { useTranslation } from "@/popup/hooks/useTranslation";
import { ActionButton } from "./EmptyState";
import { LoadingProgress } from "./LoadingProgress";
import { ResponseCard } from "./ResponseCard";
import { SkeletonLoader } from "./SkeletonLoader";

interface SolutionAnalysisPanelProps {
  problem: ProblemContext;
  analysis: SolutionAnalysis | null;
  loading: boolean;
  error: string | null;
  autoAnalyzeOnSubmit: boolean;
  settingsLoading: boolean;
  onAnalyze: (force?: boolean) => void;
  onToggleAutoAnalyze: (enabled: boolean) => void;
}

type SectionId = "bottlenecks" | "optimizations" | "edgeCases" | "feedback";

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

function defaultExpandedForVerdict(
  verdict: SubmissionVerdict | undefined,
): Set<SectionId> {
  if (!verdict) return new Set(["feedback"]);

  switch (verdict) {
    case "wrong_answer":
      return new Set(["edgeCases", "feedback"]);
    case "tle":
      return new Set(["bottlenecks", "optimizations", "feedback"]);
    case "accepted":
      return new Set(["optimizations", "feedback"]);
    case "runtime_error":
    case "compile_error":
      return new Set(["feedback", "edgeCases"]);
    default:
      return new Set(["feedback"]);
  }
}

function resolveStrengths(analysis: SolutionAnalysis): string[] {
  return analysis.interviewStrengths ?? [];
}

function resolveImprovements(analysis: SolutionAnalysis): string[] {
  return analysis.interviewImprovements ?? [];
}

function feedbackItemCount(analysis: SolutionAnalysis): number {
  const strengths = resolveStrengths(analysis);
  const improvements = resolveImprovements(analysis);
  if (strengths.length + improvements.length > 0) {
    return strengths.length + improvements.length;
  }
  return analysis.interviewFeedback ? 1 : 0;
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
  id: SectionId;
  title: string;
  count: number;
  expanded: boolean;
  onToggle: (id: SectionId) => void;
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

const VERDICT_LABEL_KEYS: Record<SubmissionVerdict, TranslationKey> = {
  accepted: "solutionVerdict_accepted",
  wrong_answer: "solutionVerdict_wrong_answer",
  tle: "solutionVerdict_tle",
  runtime_error: "solutionVerdict_runtime_error",
  compile_error: "solutionVerdict_compile_error",
};

export function SolutionAnalysisPanel({
  problem,
  analysis,
  loading,
  error,
  autoAnalyzeOnSubmit,
  settingsLoading,
  onAnalyze,
  onToggleAutoAnalyze,
}: SolutionAnalysisPanelProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState<Set<SectionId>>(new Set(["feedback"]));
  const [lastAutoExpandId, setLastAutoExpandId] = useState<string | null>(null);

  useEffect(() => {
    if (!analysis) return;

    const expandKey = `${analysis.problemId}-${analysis.codeHash}-${analysis.analysisMode}-${analysis.submissionVerdict ?? "manual"}-${analysis.generatedAt}`;

    if (lastAutoExpandId === expandKey) return;

    if (analysis.analysisMode === "submission") {
      setExpanded(defaultExpandedForVerdict(analysis.submissionVerdict));
    } else {
      setExpanded(new Set(["feedback"]));
    }
    setLastAutoExpandId(expandKey);
  }, [analysis, lastAutoExpandId]);

  if (problem.platform !== "leetcode") {
    return null;
  }

  const toggleSection = (id: SectionId) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const loadingStages = [
    t("solutionLoadingRead"),
    t("solutionLoadingAnalyze"),
    t("solutionLoadingContact"),
  ];

  const modeLabel =
    analysis?.analysisMode === "submission" && analysis.submissionVerdict ?
      t(VERDICT_LABEL_KEYS[analysis.submissionVerdict])
    : analysis ?
      t("solutionModeManual")
    : null;

  const strengths = analysis ? resolveStrengths(analysis) : [];
  const improvements = analysis ? resolveImprovements(analysis) : [];
  const hasStructuredFeedback = strengths.length > 0 || improvements.length > 0;
  const legacyFeedback = analysis?.interviewFeedback?.trim();

  return (
    <section className="card">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="section-title">{t("solutionAnalysisTitle")}</p>
          <p className="mt-0.5 text-[11px] leading-snug text-slate-500">
            {t("solutionAnalysisSubtitle")}
          </p>
        </div>
        {(modeLabel || analysis?.cached) && !loading && (
          <div className="flex shrink-0 flex-wrap justify-end gap-1">
            {modeLabel && (
              <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-medium text-violet-700">
                {modeLabel}
              </span>
            )}
            {analysis?.cached && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                {t("solutionCached")}
              </span>
            )}
          </div>
        )}
      </div>

      <label className="mb-3 flex cursor-pointer items-center gap-2.5 rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2.5 transition hover:border-slate-200">
        <input
          type="checkbox"
          checked={autoAnalyzeOnSubmit}
          disabled={settingsLoading}
          onChange={(event) => onToggleAutoAnalyze(event.target.checked)}
          className="h-3.5 w-3.5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
        />
        <span className="text-xs leading-snug text-slate-600">
          {t("solutionAutoAnalyzeOnSubmit")}
        </span>
      </label>

      <ActionButton
        label={analysis ? t("solutionReanalyze") : t("solutionAnalyze")}
        onClick={() => onAnalyze(Boolean(analysis))}
        loading={loading}
        variant="primary"
      />

      {loading && (
        <div className="mt-4 space-y-3">
          <SkeletonLoader variant="generic" />
          <LoadingProgress
            stages={loadingStages}
            title={t("solutionLoading")}
            waitingMessage={t("loadingWaiting")}
            slowMessage={t("loadingSlow")}
          />
        </div>
      )}

      {error && !loading && (
        <p className="mt-3 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-600">
          {error}
        </p>
      )}

      {analysis && !loading && (
        <div className="mt-4 space-y-2.5">
          <ResponseCard title={t("solutionYourCode")} accent="violet">
            <p className="font-medium leading-snug text-slate-800">{analysis.pattern}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-100 bg-white/80 px-2.5 py-1 text-xs">
                <span className="text-slate-500">{t("time")}</span>
                <span className="font-semibold text-slate-800">{analysis.timeComplexity}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-100 bg-white/80 px-2.5 py-1 text-xs">
                <span className="text-slate-500">{t("space")}</span>
                <span className="font-semibold text-slate-800">{analysis.spaceComplexity}</span>
              </span>
            </div>
          </ResponseCard>

          <ExpandableSection
            id="feedback"
            title={t("solutionInterviewFeedback")}
            count={feedbackItemCount(analysis)}
            expanded={expanded.has("feedback")}
            onToggle={toggleSection}
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
                  <FeedbackSubsection title={t("solutionImprovements")} accent="amber">
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
            count={analysis.bottlenecks.length}
            expanded={expanded.has("bottlenecks")}
            onToggle={toggleSection}
          >
            <BulletList items={analysis.bottlenecks} />
          </ExpandableSection>

          <ExpandableSection
            id="optimizations"
            title={t("solutionOptimizations")}
            count={analysis.optimizations.length}
            expanded={expanded.has("optimizations")}
            onToggle={toggleSection}
          >
            <BulletList items={analysis.optimizations} />
          </ExpandableSection>

          <ExpandableSection
            id="edgeCases"
            title={t("solutionEdgeCases")}
            count={analysis.missedEdgeCases.length}
            expanded={expanded.has("edgeCases")}
            onToggle={toggleSection}
          >
            <BulletList items={analysis.missedEdgeCases} />
          </ExpandableSection>
        </div>
      )}
    </section>
  );
}
