import type { ProblemContext } from "@/shared/types";
import type { MentorAnalysis } from "@/shared/types/hints";
import { useTranslation } from "@/popup/hooks/useTranslation";

interface ProblemSummaryProps {
  problem: ProblemContext | null;
  analysis: MentorAnalysis | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}

export function ProblemSummary({
  problem,
  analysis,
  loading,
  error,
  onRefresh,
}: ProblemSummaryProps) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
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
      <section className="rounded-2xl border border-red-100 bg-red-50/60 p-4">
        <p className="text-sm text-red-600">{error}</p>
        <button
          type="button"
          onClick={onRefresh}
          className="mt-2 text-sm font-medium text-red-700 hover:underline"
        >
          {t("retry")}
        </button>
      </section>
    );
  }

  if (!problem) {
    return (
      <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
        <p className="text-sm text-slate-500">{t("noProblem")}</p>
        <button
          type="button"
          onClick={onRefresh}
          className="mt-2 text-sm font-medium text-blue-600 hover:underline"
        >
          {t("refresh")}
        </button>
      </section>
    );
  }

  const difficulty = analysis?.difficulty;
  const exampleLabel =
    problem.examples.length === 1 ?
      t("exampleCount", { count: 1 })
    : t("exampleCount_plural", { count: problem.examples.length });

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {t("problem")}
      </p>

      <h2 className="mt-2 text-sm font-semibold leading-snug text-slate-900">
        {problem.title}
      </h2>

      {(analysis?.summary || problem.description) && (
        <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-slate-600">
          {analysis?.summary || problem.description}
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        {difficulty && (
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-700">
            {t("difficulty")}: {difficulty}
          </span>
        )}
        {problem.examples.length > 0 && (
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600">
            {exampleLabel}
          </span>
        )}
      </div>
    </section>
  );
}
