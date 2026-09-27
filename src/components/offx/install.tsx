import { Download, Share, Smartphone, Monitor, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/offx/settings";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isStandalone() {
  if (typeof window === "undefined") return false;
  const mq = window.matchMedia("(display-mode: standalone)").matches;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return mq || nav.standalone === true;
}

function detectPlatform(): "ios" | "android" | "desktop" {
  if (typeof window === "undefined") return "desktop";
  const ua = window.navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)) {
    return "ios";
  }
  if (/Android/i.test(ua)) return "android";
  return "desktop";
}

export function PwaBoot() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    void navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {});
  }, []);
  return null;
}

export function useInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [platform, setPlatform] = useState<"ios" | "android" | "desktop">("desktop");

  useEffect(() => {
    setInstalled(isStandalone());
    setPlatform(detectPlatform());
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function nativeInstall() {
    if (!deferred) return false;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    if (choice.outcome === "accepted") setInstalled(true);
    setDeferred(null);
    return choice.outcome === "accepted";
  }

  return {
    deferred,
    installed,
    platform,
    nativeInstall,
    canNative: Boolean(deferred),
  };
}

export function InstallButton({
  variant = "secondary",
  className,
  compact = false,
}: {
  variant?: "default" | "secondary";
  className?: string;
  compact?: boolean;
}) {
  const { installed, canNative, platform, nativeInstall } = useInstallPrompt();
  const [open, setOpen] = useState(false);
  const t = useT();

  if (installed) {
    if (compact) return null;
    return (
      <p className="text-center text-xs text-faint">{t("install.done")}</p>
    );
  }

  async function onClick() {
    if (canNative) {
      const ok = await nativeInstall();
      if (ok) return;
    }
    if (platform === "ios") {
      window.location.href = "/?install=1&platform=ios";
      return;
    }
    setOpen(true);
  }

  return (
    <>
      <Button
        type="button"
        variant={compact ? "ghost" : variant}
        className={
          className ??
          (compact ? "h-10 w-full justify-start rounded-lg px-3 text-muted" : "h-12 w-full rounded-lg")
        }
        onClick={() => void onClick()}
      >
        <Download className="size-4" />
        {platform === "ios" ? t("install.ios") : t("install.cta")}
      </Button>
      {open && <InstallSheet platform={platform} onClose={() => setOpen(false)} />}
    </>
  );
}

function InstallSheet({
  platform,
  onClose,
}: {
  platform: "ios" | "android" | "desktop";
  onClose: () => void;
}) {
  const t = useT();
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-bg/70 p-3 lg:items-center">
      <div className="relative w-full max-w-md rounded-2xl bg-surface p-5 shadow-[var(--shadow-lift)]">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 grid size-10 place-items-center text-muted"
          aria-label={t("common.close")}
        >
          <X className="size-4" />
        </button>
        <p className="pr-8 font-display text-xl tracking-[0.12em]">{t("install.title")}</p>
        <p className="mt-2 text-sm leading-relaxed text-muted">{t("install.body")}</p>
        <ul className="mt-5 space-y-4">
          <Step icon={Smartphone} title="iPhone / iPad" active={platform === "ios"} body={t("install.stepIos")} />
          <Step icon={Smartphone} title="Android" active={platform === "android"} body={t("install.stepAndroid")} />
          <Step icon={Monitor} title="Windows" active={platform === "desktop"} body={t("install.stepDesktop")} />
        </ul>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <a
            href="/api/native?kind=apk"
            className="flex h-12 items-center justify-center rounded-lg bg-elevated text-sm font-medium"
          >
            APK
          </a>
          <a
            href="/api/native?kind=exe"
            className="flex h-12 items-center justify-center rounded-lg bg-elevated text-sm font-medium"
          >
            EXE
          </a>
        </div>
        {platform === "ios" && (
          <Button
            className="mt-3 h-12 w-full rounded-lg"
            onClick={() => {
              window.location.href = "/?install=1&platform=ios";
            }}
          >
            iPhone
          </Button>
        )}
      </div>
    </div>
  );
}

function Step({
  icon: Icon,
  title,
  body,
  active,
}: {
  icon: typeof Smartphone;
  title: string;
  body: string;
  active: boolean;
}) {
  return (
    <li className="flex gap-3">
      <span
        className={
          active
            ? "grid size-10 shrink-0 place-items-center rounded-lg bg-fg text-bg"
            : "grid size-10 shrink-0 place-items-center rounded-lg bg-elevated text-muted"
        }
      >
        <Icon className="size-4" />
      </span>
      <span>
        <span className="block text-sm font-medium">{title}</span>
        <span className="text-sm leading-relaxed text-muted">{body}</span>
      </span>
    </li>
  );
}

export function InviteButton({ handle }: { handle?: string }) {
  async function share() {
    const url = typeof window !== "undefined" ? window.location.origin : "";
    const text = handle
      ? `Schreib mir auf Offchat — @${handle}`
      : "Offchat — Chat, Pay, Post. Nur echte Menschen.";
    try {
      if (navigator.share) {
        await navigator.share({ title: "OFFCHAT", text, url });
        return;
      }
      await navigator.clipboard.writeText(url ? `${text} ${url}` : text);
    } catch {
      /* cancelled */
    }
  }
  return (
    <Button type="button" variant="secondary" className="h-11 rounded-lg" onClick={() => void share()}>
      <Share className="size-4" />
      Freund:innen einladen
    </Button>
  );
}
