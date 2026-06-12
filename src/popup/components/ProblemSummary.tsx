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
  isSaved?: boolean;
  onToggleSave?: () => void;
  saveLoading?: boolean;
  /** Renders content only — parent supplies card chrome and header */
  embedded?: boolean;
}

function BookmarkIcon({ filled }: { filled: boolean }) {
  if (filled) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        className="h-3.5 w-3.5"
        aria-hidden
      >
        <path
          fillRule="evenodd"
          d="M10 2a1 1 0 011 1v13.382l-4.553-2.276A1 1 0 014 13.382V3a1 1 0 011-1h5zm2 0h3a1 1 0 011 1v10.382a1 1 0 01-1.447.894L12 12.118V3z"
          clipRule="evenodd"
        />
      </svg>
    );
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="h-3.5 w-3.5"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
      />
    </svg>
  );
}

export function ProblemSummary({
  problem,
  loading,
  error,
  onRefresh,
  isSaved = false,
  onToggleSave,
  saveLoading = false,
  embedded = false,
}: ProblemSummaryProps) {
  const { t, locale } = useTranslation();
  const { displayDescription, loading: translationLoading } = useProblemTranslation(
    problem,
    locale,
  );

  if (loading) {
    const skeleton = (
      <div className="space-y-2">
        <div className="skeleton h-4 w-3/4 rounded-md" />
        <div className="skeleton h-3 w-full rounded-md" />
        <div className="skeleton h-3 w-5/6 rounded-md" />
      </div>
    );

    if (embedded) return skeleton;

    return (
      <section className="card-hero">
        <p className="section-title">{t("problem")}</p>
        <div className="mt-3">{skeleton}</div>
      </section>
    );
  }

  if (error) {
    const errorBody = (
      <>
        <p className="text-sm text-red-600">{error}</p>
        <button
          type="button"
          onClick={onRefresh}
          className="mt-2 text-sm font-medium text-red-700 hover:underline"
        >
          {t("retry")}
        </button>
      </>
    );

    if (embedded) return errorBody;

    return (
      <section className="rounded-2xl border border-red-100 bg-red-50/60 p-5">
        {errorBody}
      </section>
    );
  }

  if (!problem) {
    const emptyBody = (
      <>
        <p className="text-sm text-slate-500">{t("noProblem")}</p>
        <button
          type="button"
          onClick={onRefresh}
          className="mt-2 text-sm font-medium text-brand-600 hover:underline"
        >
          {t("refresh")}
        </button>
      </>
    );

    if (embedded) return emptyBody;

    return <section className="card-hero">{emptyBody}</section>;
  }

  const exampleLabel =
    problem.examples.length === 1 ?
      t("exampleCount", { count: 1 })
    : t("exampleCount_plural", { count: problem.examples.length });

  const content = (
    <>
      <div className={`flex items-start justify-between gap-2 ${embedded ? "" : "mt-3"}`}>
        <h2 className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-base font-semibold leading-snug text-slate-900">
          <span>{problem.title}</span>
          {problem.difficulty && <DifficultyBadge difficulty={problem.difficulty} />}
        </h2>
        {problem.problemId && onToggleSave && (
          <button
            type="button"
            onClick={onToggleSave}
            disabled={saveLoading}
            className={`flex shrink-0 items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition disabled:opacity-50 ${
              isSaved ?
                "border-brand-200 bg-brand-50 text-brand-700 hover:bg-brand-100"
              : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
            }`}
            aria-pressed={isSaved}
          >
            <BookmarkIcon filled={isSaved} />
            {isSaved ? t("unsaveProblem") : t("saveProblem")}
          </button>
        )}
      </div>

      {problem.description && (
        <div className="mt-3 min-h-[5.75rem]">
          {translationLoading ?
            <TranslationLoadingSkeleton />
          : <ExpandableText text={displayDescription} maxLines={3} />}
        </div>
      )}

      {problem.examples.length > 0 && (
        <div className="mt-4 border-t border-slate-100 pt-3">
          <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
            {exampleLabel}
          </span>
        </div>
      )}
    </>
  );

  if (embedded) return content;

  return (
    <section className="card-hero">
      <p className="section-title">{t("problem")}</p>
      <div className="mt-3">{content}</div>
    </section>
  );
}
