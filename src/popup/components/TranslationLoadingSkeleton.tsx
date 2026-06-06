import { useTranslation } from "@/popup/hooks/useTranslation";

/**
 * Inline skeleton shown while a problem description is being translated.
 * Reserves space matching the collapsed ExpandableText layout to avoid layout shift.
 */
export function TranslationLoadingSkeleton() {
  const { t } = useTranslation();

  return (
    <div
      className="flex min-h-[5.75rem] flex-col"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={t("translatingProblem")}
    >
      <div className="mb-2.5 flex items-center gap-2">
        <span
          className="inline-block h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600 dark:border-blue-900 dark:border-t-blue-400"
          aria-hidden="true"
        />
        <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
          {t("translatingProblem")}
        </p>
      </div>

      <div className="space-y-2" aria-hidden="true">
        <div className="skeleton h-3 w-full rounded-md" />
        <div className="skeleton h-3 w-5/6 rounded-md" />
        <div className="skeleton h-3 w-2/3 rounded-md" />
      </div>

      <div className="skeleton mt-1.5 h-3 w-24 rounded-md" aria-hidden="true" />
    </div>
  );
}
