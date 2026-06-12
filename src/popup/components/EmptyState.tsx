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
    <div className="text-center">
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
      className={isPrimary ? "btn-primary" : "btn-secondary w-full"}
    >
      {label}
    </button>
  );
}

export { ActionButton };
