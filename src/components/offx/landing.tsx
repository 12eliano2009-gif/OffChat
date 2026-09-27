import { Link } from "@tanstack/react-router";
import { Monitor, Moon, Smartphone, Sun } from "lucide-react";
import { formatEuro } from "@/lib/offx/packs";
import { AuthForm } from "./auth-form";
import { InstallButton } from "./install";
import { useSettings } from "@/lib/offx/settings";
import { LOCALES, LOCALE_META } from "@/lib/offx/i18n";

export function Landing() {
  const { t, locale, setLocale, theme, setTheme } = useSettings();
  return (
    <main className="relative min-h-dvh bg-bg text-fg">
      <img
        src="/brand/offx-hero.jpg"
        alt=""
        className="absolute inset-0 size-full object-cover object-top"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/75 to-bg/25" />
      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pb-8 pt-16">
        <div className="flex justify-end gap-2 pr-16">
          <button
            type="button"
            className="grid size-9 place-items-center rounded-full bg-surface/80 text-fg backdrop-blur"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            aria-label={theme === "light" ? t("settings.dark") : t("settings.light")}
          >
            {theme === "light" ? <Moon className="size-4" /> : <Sun className="size-4" />}
          </button>
          <select
            id="offchat-lang"
            value={locale}
            onChange={(e) => setLocale(e.target.value as typeof locale)}
            aria-label={t("settings.language")}
            className="h-9 rounded-full bg-surface/80 px-3 text-[11px] font-medium text-fg backdrop-blur outline-none"
          >
            {LOCALES.map((loc) => (
              <option key={loc} value={loc}>
                {LOCALE_META[loc].short}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2 pr-20">
          <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-muted">
            {t("landing.kicker")}
          </p>
          <h1 className="font-display text-4xl tracking-[0.1em] text-fg lg:text-5xl lg:tracking-[0.12em]">
            OFFCHAT
          </h1>
          <p className="max-w-sm text-pretty text-sm leading-relaxed text-muted">
            {t("landing.body")}
          </p>
        </div>

        <div className="mt-auto space-y-3 pt-6">
          <div className="grid grid-cols-3 gap-2">
            <PlatformChip icon={Smartphone} label="Android" />
            <PlatformChip icon={Smartphone} label="iPhone" />
            <PlatformChip icon={Monitor} label="PC & Mac" />
          </div>
          <div className="space-y-3 rounded-2xl bg-surface/90 p-5 shadow-[var(--shadow-border)] backdrop-blur-md">
            <div className="grid grid-cols-2 gap-2">
              <a
                href="/api/native?kind=apk"
                className="flex h-11 items-center justify-center rounded-lg bg-elevated text-sm font-medium"
              >
                APK
              </a>
              <a
                href="/api/native?kind=exe"
                className="flex h-11 items-center justify-center rounded-lg bg-elevated text-sm font-medium"
              >
                EXE
              </a>
            </div>
            <InstallButton />
            <Link
              to="/get"
              className="block text-center text-sm text-muted underline-offset-4 hover:underline"
            >
              {t("landing.how")}
            </Link>
            <p className="text-center text-[11px] uppercase tracking-[0.18em] text-faint">
              {t("landing.signin")}
            </p>
            <AuthForm compact />
            <p className="text-center text-xs text-faint">
              10 NOX = {formatEuro(0.99)} · 70 % kommen an
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

function PlatformChip({ icon: Icon, label }: { icon: typeof Smartphone; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl bg-surface/80 px-2 py-3 backdrop-blur">
      <Icon className="size-4 text-fg" />
      <span className="text-[11px] text-muted">{label}</span>
    </div>
  );
}
