import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { sendMessage } from "@/shared/messaging";
import { LOCALE_STORAGE_KEY } from "@/shared/constants/extension-storage";
import type { AppLocale } from "@/popup/locales";

function detectBrowserLocale(): AppLocale {
  const lang = navigator.language.toLowerCase();
  return lang.startsWith("vi") ? "vi" : "en";
}

async function loadStoredLocale(): Promise<AppLocale | null> {
  try {
    const result = await chrome.storage.local.get(LOCALE_STORAGE_KEY);
    const stored = result[LOCALE_STORAGE_KEY];
    if (stored === "en" || stored === "vi") return stored;
  } catch {
    /* popup may run outside extension context during dev */
  }
  return null;
}

async function persistLocale(locale: AppLocale): Promise<void> {
  try {
    await chrome.storage.local.set({ [LOCALE_STORAGE_KEY]: locale });
  } catch {
    /* ignore */
  }
}

interface LanguageContextValue {
  locale: AppLocale;
  setLocale: (locale: AppLocale) => void;
  ready: boolean;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<AppLocale>("en");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void (async () => {
      const stored = await loadStoredLocale();
      setLocaleState(stored ?? detectBrowserLocale());
      setReady(true);
    })();
  }, []);

  const setLocale = useCallback((next: AppLocale) => {
    setLocaleState(next);
    void persistLocale(next);
    void sendMessage({ type: "REFRESH_CONTEXT_MENUS" });
  }, []);

  return (
    <LanguageContext.Provider value={{ locale, setLocale, ready }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return ctx;
}
