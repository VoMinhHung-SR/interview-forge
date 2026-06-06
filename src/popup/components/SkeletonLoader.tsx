import { useTranslation } from "@/popup/hooks/useTranslation";

type SkeletonVariant = "hint" | "pattern" | "complexity" | "generic";

interface SkeletonLoaderProps {
  variant?: SkeletonVariant;
}

export function SkeletonLoader({ variant = "generic" }: SkeletonLoaderProps) {
  const { t } = useTranslation();

  const title =
    variant === "pattern" ? t("loadingPattern")
    : variant === "complexity" ? t("loadingComplexity")
    : t("loadingHint");

  return (
    <div
      className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="mb-4 flex items-center gap-3">
        <span className="loading-spinner" aria-hidden="true" />
        <div>
          <p className="text-sm font-medium text-slate-800">{title}</p>
          <p className="text-xs text-slate-500">{t("loadingStageContact")}</p>
        </div>
      </div>

      <div className="space-y-2.5">
        <div className="skeleton h-3 w-full rounded-md" />
        <div className="skeleton h-3 w-5/6 rounded-md" />
        <div className="skeleton h-3 w-2/3 rounded-md" />
      </div>
    </div>
  );
}
