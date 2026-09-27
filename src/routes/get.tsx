import { createFileRoute, Link } from "@tanstack/react-router";
import { Download, Monitor, Smartphone } from "lucide-react";
import { InstallButton } from "@/components/offx/install";
import { OffxLockup } from "@/components/offx/logo";
import { useT } from "@/lib/offx/settings";

export const Route = createFileRoute("/get")({ component: GetApp });

function GetApp() {
  const t = useT();
  return (
    <main className="min-h-dvh bg-bg px-5 py-12 text-fg">
      <div className="mx-auto w-full max-w-md space-y-8">
        <OffxLockup />
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-muted">
            {t("get.kicker")}
          </p>
          <h1 className="mt-2 font-display text-4xl tracking-[0.12em]">{t("get.title")}</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">{t("get.body")}</p>
        </div>

        <div className="grid grid-cols-1 gap-2">
          <a
            href="/api/native?kind=exe"
            className="flex h-14 items-center gap-3 rounded-xl bg-fg px-4 text-sm font-medium text-bg"
          >
            <Monitor className="size-5" />
            <span className="flex-1 text-left">{t("settings.dllWindows")}</span>
            <Download className="size-4" />
          </a>
          <a
            href="/api/native?kind=apk"
            className="flex h-14 items-center gap-3 rounded-xl bg-surface px-4 text-sm font-medium shadow-[var(--shadow-border)]"
          >
            <Smartphone className="size-5" />
            <span className="flex-1 text-left">{t("settings.dllAndroid")}</span>
            <Download className="size-4" />
          </a>
          <a
            href="/downloads/OFFCHAT-projekt.zip"
            download="OFFCHAT-projekt.zip"
            className="flex h-14 items-center gap-3 rounded-xl bg-surface px-4 text-sm font-medium shadow-[var(--shadow-border)]"
          >
            <Download className="size-5" />
            <span className="flex-1 text-left">Ganzes Projekt · ZIP</span>
            <span className="text-xs text-muted">16 MB</span>
          </a>
        </div>

        <InstallButton />

        <Link to="/login" className="block text-center text-sm text-muted underline-offset-4 hover:underline">
          {t("get.already")}
        </Link>
      </div>
    </main>
  );
}
