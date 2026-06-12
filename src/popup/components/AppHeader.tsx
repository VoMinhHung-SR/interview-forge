import type { AppLocale } from "@/popup/locales";
import { useTranslation } from "@/popup/hooks/useTranslation";

interface AppHeaderProps {
  locale: AppLocale;
  onLocaleChange: (locale: AppLocale) => void;
}

function ForgeIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-7 w-7 text-brand-600"
      aria-hidden
    >
      <path d="M11.5 2.5a1 1 0 011 0l7.5 4.33a1 1 0 01.5.866v8.67a1 1 0 01-.5.866l-7.5 4.33a1 1 0 01-1 0l-7.5-4.33a1 1 0 01-.5-.866V7.696a1 1 0 01.5-.866l7.5-4.33zM12 4.31 6.5 7.48v8.04L12 18.69l5.5-3.17V7.48L12 4.31z" />
      <path d="M12 8.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7zm0 1.5a2 2 0 110 4 2 2 0 010-4z" />
    </svg>
  );
}

export function AppHeader({ locale, onLocaleChange }: AppHeaderProps) {
  const { t } = useTranslation();

  return (
    <header className="card border-b-2 border-b-brand-500">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <ForgeIcon />
          <div>
            <h1 className="text-base font-semibold tracking-tight text-slate-900">
              {t("appName")}
            </h1>
            <p className="mt-0.5 text-xs text-slate-500">{t("appSubtitle")}</p>
          </div>
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
