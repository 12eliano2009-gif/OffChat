import { Globe, Wifi } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { forcedLanNet, setForcedLanCode } from "@/lib/offx/lan";
import { randomWlanCode, useOnline, WLAN_CODE_RE } from "@/lib/offx/offline";
import { useSettings } from "@/lib/offx/settings";
import { WalletView } from "./wallet-view";
import { useLan } from "./lan-provider";

export function OnlineView() {
  const lan = useLan();
  const { t, setMode } = useSettings();
  const online = useOnline();
  const connected = lan.peers.filter((p) => p.connectionState === "connected").length;
  const here = Math.max(lan.people.length, connected);
  const forced = forcedLanNet();
  const [code, setCode] = useState("");

  function applyCode(e: React.FormEvent) {
    e.preventDefault();
    const next = code.trim().toUpperCase();
    if (!WLAN_CODE_RE.test(next)) {
      toast.error("Vier Zeichen, ohne 0/O/1/I.");
      return;
    }
    setForcedLanCode(next);
    setMode("online");
    toast.success(`Raum ${next}.`);
    window.location.reload();
  }

  function makeCode() {
    const next = randomWlanCode();
    setForcedLanCode(next);
    setMode("online");
    toast.success(`Raum ${next}.`);
    window.location.reload();
  }

  function clearCode() {
    setForcedLanCode(null);
    setMode("local");
    window.location.reload();
  }

  return (
    <div className="mx-auto w-full max-w-lg tab-safe">
      <div className="px-4 pt-6">
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted">
          {t("online.kicker")}
        </p>
        <h1 className="mt-1 font-display text-2xl tracking-[0.12em]">{t("online.title")}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">{t("online.body")}</p>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <StatusCard
            icon={Wifi}
            label={t("online.net")}
            value={lan.net?.label ?? "…"}
            detail={
              here
                ? `${here} ${here === 1 ? "Person" : "Personen"} hier`
                : lan.joined
                  ? "warte auf Geräte"
                  : "sucht…"
            }
          />
          <StatusCard
            icon={Globe}
            label={t("online.web")}
            value={online ? t("online.on") : t("online.off")}
            detail={online ? t("online.nox") : t("online.localOnly")}
          />
        </div>

        <form onSubmit={applyCode} className="mt-5 rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]">
          <p className="text-sm font-medium">{t("online.room")}</p>
          <p className="mt-1 text-xs leading-relaxed text-muted">{t("online.roomHint")}</p>
          {forced ? (
            <div className="mt-3 flex items-center justify-between">
              <p className="font-display text-xl tracking-[0.28em]">
                {forced.label.replace("Raum ", "")}
              </p>
              <Button type="button" variant="secondary" className="h-10 rounded-lg" onClick={clearCode}>
                {t("online.auto")}
              </Button>
            </div>
          ) : (
            <div className="mt-3 space-y-2">
              <div className="flex gap-2">
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="K7FP"
                  maxLength={4}
                  className="h-11 font-display tracking-[0.3em]"
                />
                <Button type="submit" className="h-11 rounded-lg px-4">
                  {t("online.set")}
                </Button>
              </div>
              <Button type="button" variant="secondary" className="h-11 w-full rounded-lg" onClick={makeCode}>
                {t("online.make")}
              </Button>
            </div>
          )}
        </form>
      </div>
      <WalletView />
    </div>
  );
}

function StatusCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof Wifi;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]">
      <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.16em] text-muted">
        <Icon className="size-3.5" />
        {label}
      </p>
      <p className="mt-2 text-sm font-medium">{value}</p>
      <p className="mt-0.5 text-xs text-muted">{detail}</p>
    </div>
  );
}
