import { useState } from "react";
import { toast } from "sonner";
import { Bluetooth, Download, Globe, Monitor, Smartphone, Wifi } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LOCALES, LOCALE_META } from "@/lib/offx/i18n";
import { useSettings, type ConnMode } from "@/lib/offx/settings";
import {
  bluetoothNet,
  forcedLanNet,
  readBtCode,
  readOnlineCode,
  setBtCode,
  setForcedLanCode,
} from "@/lib/offx/lan";
import { randomWlanCode, WLAN_CODE_RE } from "@/lib/offx/offline";
import { bluetoothAvailable, codeFromDeviceName, scanOffchatDevice } from "@/lib/offx/bluetooth";
import { cn } from "@/lib/cn";
import { InstallButton } from "./install";

const MODES: { id: ConnMode; icon: typeof Wifi; title: "settings.modeLocal" | "settings.modeOnline" | "settings.modeBt"; hint: "settings.modeLocalHint" | "settings.modeOnlineHint" | "settings.modeBtHint" }[] = [
  { id: "local", icon: Wifi, title: "settings.modeLocal", hint: "settings.modeLocalHint" },
  { id: "online", icon: Globe, title: "settings.modeOnline", hint: "settings.modeOnlineHint" },
  { id: "bluetooth", icon: Bluetooth, title: "settings.modeBt", hint: "settings.modeBtHint" },
];

export function SettingsView() {
  const s = useSettings();
  const t = s.t;
  const forced = forcedLanNet();
  const bt = bluetoothNet();
  const [code, setCode] = useState(readOnlineCode() ?? readBtCode() ?? "");
  const [scanning, setScanning] = useState(false);

  function applyMode(mode: ConnMode) {
    s.setMode(mode);
    if (mode === "online" && !readOnlineCode()) {
      const next = randomWlanCode();
      setForcedLanCode(next);
      setCode(next);
    }
    if (mode === "bluetooth") {
      setCode(readBtCode() ?? bt.label.replace("BT ", ""));
    }
    toast.message(t("settings.active"));
    window.setTimeout(() => window.location.reload(), 350);
  }

  function applyCode(e: React.FormEvent) {
    e.preventDefault();
    const next = code.trim().toUpperCase();
    if (!WLAN_CODE_RE.test(next)) {
      toast.error("K7FP");
      return;
    }
    if (s.mode === "bluetooth") {
      setBtCode(next);
    } else {
      setForcedLanCode(next);
      s.setMode("online");
    }
    window.location.reload();
  }

  function makeCode() {
    const next = randomWlanCode();
    setCode(next);
    if (s.mode === "bluetooth") setBtCode(next);
    else {
      setForcedLanCode(next);
      s.setMode("online");
    }
    window.location.reload();
  }

  async function scanBt() {
    setScanning(true);
    try {
      const ok = await bluetoothAvailable();
      if (!ok) {
        toast.message(t("settings.btUnavailable"));
        return;
      }
      const found = await scanOffchatDevice();
      if (!found) return;
      toast.success(t("settings.btFound", { name: found.name }));
      const extracted = codeFromDeviceName(found.name);
      if (extracted) {
        setBtCode(extracted);
        s.setMode("bluetooth");
        window.location.reload();
      }
    } catch (err) {
      const name = err instanceof Error ? err.message : "";
      if (name !== "no-bt" && !/cancel/i.test(name)) {
        toast.message(t("settings.btUnavailable"));
      }
    } finally {
      setScanning(false);
    }
  }

  const shownCode =
    s.mode === "bluetooth"
      ? readBtCode() ?? bt.label.replace("BT ", "")
      : s.mode === "online"
        ? forced?.label.replace("Raum ", "") ?? readOnlineCode()
        : null;

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-6 tab-safe">
      <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted">OFFCHAT</p>
      <h1 className="mt-1 font-display text-2xl tracking-[0.12em]">{t("settings.title")}</h1>

      <section className="mt-6">
        <h2 className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted">
          {t("settings.appearance")}
        </h2>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <Choice active={s.theme === "dark"} onClick={() => s.setTheme("dark")} label={t("settings.dark")} />
          <Choice active={s.theme === "light"} onClick={() => s.setTheme("light")} label={t("settings.light")} />
        </div>
      </section>

      <section className="mt-7">
        <h2 className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted">
          {t("settings.mode")}
        </h2>
        <div className="mt-2 space-y-2">
          {MODES.map((m) => {
            const Icon = m.icon;
            const active = s.mode === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => applyMode(m.id)}
                className={cn(
                  "flex w-full items-start gap-3 rounded-2xl p-4 text-left shadow-[var(--shadow-border)] transition-colors duration-150",
                  active ? "bg-fg text-bg" : "bg-surface text-fg hover:bg-elevated",
                )}
              >
                <Icon className="mt-0.5 size-5 shrink-0" />
                <span>
                  <span className="block text-sm font-medium">{t(m.title)}</span>
                  <span className={cn("mt-0.5 block text-xs leading-relaxed", active ? "text-bg/70" : "text-muted")}>
                    {t(m.hint)}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        {s.mode !== "local" && (
          <form onSubmit={applyCode} className="mt-3 rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]">
            <p className="text-sm font-medium">{t("settings.code")}</p>
            {shownCode && (
              <p className="mt-2 font-display text-3xl tracking-[0.28em]">{shownCode}</p>
            )}
            <div className="mt-3 flex gap-2">
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="K7FP"
                maxLength={4}
                className="h-11 font-display tracking-[0.3em]"
              />
              <Button type="submit" className="h-11 rounded-lg px-4">
                {t("settings.codeApply")}
              </Button>
            </div>
            <Button type="button" variant="secondary" className="mt-2 h-11 w-full rounded-lg" onClick={makeCode}>
              {t("settings.codeMake")}
            </Button>
            {s.mode === "bluetooth" && (
              <Button
                type="button"
                variant="secondary"
                className="mt-2 h-11 w-full rounded-lg"
                disabled={scanning}
                onClick={() => void scanBt()}
              >
                <Bluetooth className="size-4" />
                {scanning ? t("settings.btScanning") : t("settings.btScan")}
              </Button>
            )}
          </form>
        )}
      </section>

      <section className="mt-7">
        <h2 className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted">
          {t("settings.language")}
        </h2>
        <div className="mt-2 grid grid-cols-1 gap-1.5">
          {LOCALES.map((loc) => (
            <button
              key={loc}
              type="button"
              onClick={() => s.setLocale(loc)}
              className={cn(
                "flex h-12 items-center justify-between rounded-xl px-4 text-sm font-medium",
                s.locale === loc ? "bg-fg text-bg" : "bg-surface text-fg",
              )}
            >
              <span>{LOCALE_META[loc].native}</span>
              <span className={cn("text-xs", s.locale === loc ? "text-bg/70" : "text-muted")}>
                {LOCALE_META[loc].short}
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="mt-7 space-y-3">
        <h2 className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted">
          {t("settings.downloads")}
        </h2>
        <DownloadRow
          href="/api/native?kind=exe"
          icon={Monitor}
          title={t("settings.dllWindows")}
          hint={t("settings.dllWindowsHint")}
        />
        <DownloadRow
          href="/api/native?kind=apk"
          icon={Smartphone}
          title={t("settings.dllAndroid")}
          hint={t("settings.dllAndroidHint")}
        />
        <DownloadRow
          href="/downloads/OFFCHAT-projekt.zip"
          icon={Download}
          title="Ganzes Projekt · ZIP"
          hint="Quellcode der App, etwa 16 MB. Ohne node_modules."
        />
        <div className="rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]">
          <p className="text-sm font-medium">{t("settings.dllPwa")}</p>
          <div className="mt-3">
            <InstallButton />
          </div>
        </div>
      </section>
    </div>
  );
}

function Choice({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-12 rounded-xl text-sm font-medium",
        active ? "bg-fg text-bg" : "bg-surface text-fg",
      )}
    >
      {label}
    </button>
  );
}

function DownloadRow({
  href,
  icon: Icon,
  title,
  hint,
}: {
  href: string;
  icon: typeof Download;
  title: string;
  hint: string;
}) {
  return (
    <a
      href={href}
      className="flex items-start gap-3 rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]"
    >
      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-elevated">
        <Icon className="size-5" />
      </span>
      <span>
        <span className="flex items-center gap-2 text-sm font-medium">
          {title}
          <Download className="size-3.5 text-muted" />
        </span>
        <span className="mt-0.5 block text-xs leading-relaxed text-muted">{hint}</span>
      </span>
    </a>
  );
}
