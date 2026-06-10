import { useTranslation } from "@/popup/hooks/useTranslation";

interface StickyActionBarProps {
  problemTitle: string;
  visible: boolean;
  onGetHint: () => void;
}

export function StickyActionBar({
  problemTitle,
  visible,
  onGetHint,
}: StickyActionBarProps) {
  const { t } = useTranslation();

  if (!visible) return null;

  return (
    <div className="sticky top-0 z-10 -mx-4 mb-3 border-b border-slate-200 bg-white/95 px-4 py-2.5 shadow-sm backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <p className="min-w-0 flex-1 truncate text-xs font-medium text-slate-700">
          {problemTitle}
        </p>
        <button
          type="button"
          onClick={onGetHint}
          className="shrink-0 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-brand-500"
        >
          {t("getHint")}
        </button>
      </div>
    </div>
  );
}
