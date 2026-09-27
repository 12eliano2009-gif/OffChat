import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { LOCALES, translate, type Locale, type MsgKey } from "./i18n";
import type { ConnMode } from "./mode";

export type Theme = "dark" | "light";
export type { ConnMode };

export type AppSettings = {
  theme: Theme;
  locale: Locale;
  mode: ConnMode;
};

const STORAGE = "offchat-settings";
const defaults: AppSettings = { theme: "dark", locale: "de", mode: "local" };

function readStored(): AppSettings {
  if (typeof localStorage === "undefined") return defaults;
  try {
    const raw = localStorage.getItem(STORAGE);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    const theme: Theme = parsed.theme === "light" ? "light" : "dark";
    const locale: Locale = LOCALES.includes(parsed.locale as Locale)
      ? (parsed.locale as Locale)
      : "de";
    const mode: ConnMode =
      parsed.mode === "online" || parsed.mode === "bluetooth" ? parsed.mode : "local";
    return { theme, locale, mode };
  } catch {
    return defaults;
  }
}

function applyDom(next: AppSettings) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.toggle("light", next.theme === "light");
  root.classList.toggle("dark", next.theme !== "light");
  root.lang = next.locale === "zh" ? "zh-Hans" : next.locale;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", next.theme === "light" ? "#f3f1ec" : "#111113");
}

type SettingsApi = AppSettings & {
  setTheme: (theme: Theme) => void;
  setLocale: (locale: Locale) => void;
  setMode: (mode: ConnMode) => void;
  t: (key: MsgKey, vars?: Record<string, string | number>) => string;
};

const SettingsContext = createContext<SettingsApi | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(() =>
    typeof window === "undefined" ? defaults : readStored(),
  );

  useEffect(() => {
    const stored = readStored();
    setSettings(stored);
    applyDom(stored);
  }, []);

  const commit = useCallback((patch: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem(STORAGE, JSON.stringify(next));
      } catch {
        /* private mode */
      }
      applyDom(next);
      return next;
    });
  }, []);

  const api = useMemo<SettingsApi>(
    () => ({
      ...settings,
      setTheme: (theme) => commit({ theme }),
      setLocale: (locale) => commit({ locale }),
      setMode: (mode) => commit({ mode }),
      t: (key, vars) => translate(settings.locale, key, vars),
    }),
    [settings, commit],
  );

  return <SettingsContext.Provider value={api}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsApi {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings outside provider");
  return ctx;
}

export function useT() {
  return useSettings().t;
}
