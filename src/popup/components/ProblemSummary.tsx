import type { ProblemContext } from "@/shared/types";
import { useProblemTranslation } from "@/popup/hooks/useProblemTranslation";
import { useTranslation } from "@/popup/hooks/useTranslation";
import { DifficultyBadge } from "./DifficultyBadge";
import { ExpandableText } from "./ExpandableText";
import { TranslationLoadingSkeleton } from "./TranslationLoadingSkeleton";

interface ProblemSummaryProps {
  problem: ProblemContext | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}

const PROBLEM_CARD_CLASS =
  "rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-700/80 dark:bg-slate-900";

export function ProblemSummary({
  problem,
  loading,
  error,
  onRefresh,
}: ProblemSummaryProps) {
  const { t, locale } = useTranslation();
  const { displayDescription, loading: translationLoading } = useProblemTranslation(
    problem,
    locale,
  );

  if (loading) {
    return (
      <section className={PROBLEM_CARD_CLASS}>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
          {t("problem")}
        </p>
        <div className="mt-3 space-y-2">
          <div className="skeleton h-4 w-3/4 rounded-md" />
          <div className="skeleton h-3 w-full rounded-md" />
          <div className="skeleton h-3 w-5/6 rounded-md" />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-2xl border border-red-100 bg-red-50/60 p-5 dark:border-red-900/50 dark:bg-red-950/40">
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        <button
          type="button"
          onClick={onRefresh}
          className="mt-2 text-sm font-medium text-red-700 hover:underline dark:text-red-300"
        >
          {t("retry")}
        </button>
      </section>
    );
  }

  if (!problem) {
    return (
      <section className={PROBLEM_CARD_CLASS}>
        <p className="text-sm text-slate-500 dark:text-slate-400">{t("noProblem")}</p>
        <button
          type="button"
          onClick={onRefresh}
          className="mt-2 text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
        >
          {t("refresh")}
        </button>
      </section>
    );
  }

  const exampleLabel =
    problem.examples.length === 1 ?
      t("exampleCount", { count: 1 })
    : t("exampleCount_plural", { count: problem.examples.length });

  return (
    <section className={PROBLEM_CARD_CLASS}>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
        {t("problem")}
      </p>

      <h2 className="mt-3 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm font-semibold leading-snug text-slate-900 dark:text-slate-100">
        <span>{problem.title}</span>
        {problem.difficulty && <DifficultyBadge difficulty={problem.difficulty} />}
      </h2>

      {problem.description && (
        <div className="mt-3 min-h-[5.75rem]">
          {translationLoading ?
            <TranslationLoadingSkeleton />
          : <ExpandableText text={displayDescription} maxLines={3} />}
        </div>
      )}

      {problem.examples.length > 0 && (
        <div className="mt-4 border-t border-slate-100 pt-3 dark:border-slate-800">
          <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {exampleLabel}
          </span>
        </div>
      )}
    </section>
  );
}
