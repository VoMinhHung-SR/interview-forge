import type { AppLocale } from "@/popup/locales";
import { useTranslation } from "@/popup/hooks/useTranslation";

interface AppHeaderProps {
  locale: AppLocale;
  onLocaleChange: (locale: AppLocale) => void;
}

export function AppHeader({ locale, onLocaleChange }: AppHeaderProps) {
  const { t } = useTranslation();

  return (
    <header className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-base font-semibold tracking-tight text-slate-900">
            {t("appName")}
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">{t("appSubtitle")}</p>
        </div>

        <div className="flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-0.5">
          {(["en", "vi"] as const).map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => onLocaleChange(code)}
              className={`rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${
                locale === code ?
                  "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
              }`}
              aria-pressed={locale === code}
            >
              {code.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
