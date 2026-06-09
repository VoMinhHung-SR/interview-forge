import { useState, type ReactNode } from "react";
import type { ProblemContext, SolutionAnalysis } from "@/shared/types";
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
  onAnalyze: (force?: boolean) => void;
}

type SectionId = "bottlenecks" | "optimizations" | "edgeCases" | "feedback";

function BulletList({ items }: { items: string[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-slate-500">—</p>;
  }

  return (
    <ul className="list-disc space-y-1.5 pl-4 text-sm text-slate-800">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

function ExpandableSection({
  id,
  title,
  count,
  expanded,
  onToggle,
  children,
}: {
  id: SectionId;
  title: string;
  count: number;
  expanded: boolean;
  onToggle: (id: SectionId) => void;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white">
      <button
        type="button"
        onClick={() => onToggle(id)}
        className="flex w-full items-center justify-between px-3.5 py-2.5 text-left"
      >
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {title}
          {count > 0 ? ` (${count})` : ""}
        </span>
        <span className="text-xs text-slate-400">{expanded ? "−" : "+"}</span>
      </button>
      {expanded && <div className="border-t border-slate-100 px-3.5 py-3">{children}</div>}
    </div>
  );
}

export function SolutionAnalysisPanel({
  problem,
  analysis,
  loading,
  error,
  onAnalyze,
}: SolutionAnalysisPanelProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState<Set<SectionId>>(new Set());

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

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            {t("solutionAnalysisTitle")}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500">{t("solutionAnalysisSubtitle")}</p>
        </div>
        {analysis?.cached && !loading && (
          <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
            {t("solutionCached")}
          </span>
        )}
      </div>

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
        <div className="mt-4 space-y-3">
          <ResponseCard title={t("solutionYourCode")} accent="violet">
            <p className="font-medium text-slate-800">{analysis.pattern}</p>
            <dl className="mt-2 grid grid-cols-2 gap-2 text-sm">
              <div>
                <dt className="text-xs text-slate-500">{t("time")}</dt>
                <dd className="font-medium text-slate-800">{analysis.timeComplexity}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">{t("space")}</dt>
                <dd className="font-medium text-slate-800">{analysis.spaceComplexity}</dd>
              </div>
            </dl>
          </ResponseCard>

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

          <ExpandableSection
            id="feedback"
            title={t("solutionInterviewFeedback")}
            count={analysis.interviewFeedback ? 1 : 0}
            expanded={expanded.has("feedback")}
            onToggle={toggleSection}
          >
            <p className="text-sm leading-relaxed text-slate-800">
              {analysis.interviewFeedback || "—"}
            </p>
          </ExpandableSection>
        </div>
      )}
    </section>
  );
}
