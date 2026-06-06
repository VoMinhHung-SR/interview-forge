import { useTranslation } from "@/popup/hooks/useTranslation";

interface EmptyStateProps {
  onGetHint: () => void;
  onAnalyzePattern: () => void;
  onComplexity: () => void;
  loading: boolean;
}

export function EmptyState({
  onGetHint,
  onAnalyzePattern,
  onComplexity,
  loading,
}: EmptyStateProps) {
  const { t } = useTranslation();

  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-5 text-center">
      <p className="text-sm font-medium text-slate-800">{t("emptyTitle")}</p>
      <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
        {t("emptySubtitle")}
      </p>

      <div className="mt-4 flex flex-col gap-2">
        <ActionButton
          label={t("getHint")}
          onClick={onGetHint}
          loading={loading}
          variant="primary"
        />
        <div className="grid grid-cols-2 gap-2">
          <ActionButton
            label={t("analyzePattern")}
            onClick={onAnalyzePattern}
            loading={loading}
          />
          <ActionButton
            label={t("complexity")}
            onClick={onComplexity}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
}

interface ActionButtonProps {
  label: string;
  onClick: () => void;
  loading: boolean;
  variant?: "primary" | "secondary";
}

function ActionButton({
  label,
  onClick,
  loading,
  variant = "secondary",
}: ActionButtonProps) {
  const isPrimary = variant === "primary";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={`rounded-xl px-3 py-2 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        isPrimary ?
          "bg-slate-900 text-white hover:bg-slate-800"
        : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
      }`}
    >
      {label}
    </button>
  );
}

export { ActionButton };
