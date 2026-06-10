import { useTranslation } from "@/popup/hooks/useTranslation";

export function TranslationLoadingSkeleton() {
  const { t } = useTranslation();

  return (
    <div className="space-y-2" aria-busy="true">
      <div className="flex items-center gap-2">
        <span
          className="inline-block h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600"
          aria-hidden
        />
        <p className="text-xs font-medium text-slate-600">
          {t("translatingProblem")}
        </p>
      </div>
      <div className="skeleton h-3 w-full rounded-md" />
      <div className="skeleton h-3 w-5/6 rounded-md" />
    </div>
  );
}
