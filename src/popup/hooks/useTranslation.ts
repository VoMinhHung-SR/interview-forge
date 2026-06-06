import { en, vi, type TranslationKey } from "@/popup/locales";
import { useLanguage } from "./useLanguage";

type InterpolationValues = Record<string, string | number>;

function interpolate(template: string, values?: InterpolationValues): string {
  if (!values) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) =>
    values[key] !== undefined ? String(values[key]) : `{{${key}}}`,
  );
}

export function useTranslation() {
  const { locale, setLocale, ready } = useLanguage();
  const dictionary = locale === "vi" ? vi : en;

  function t(key: TranslationKey, values?: InterpolationValues): string {
    return interpolate(dictionary[key], values);
  }

  return { t, locale, setLocale, ready };
}
