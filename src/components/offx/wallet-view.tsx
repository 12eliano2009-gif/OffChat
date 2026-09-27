import { ArrowDownLeft, ArrowUpRight, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getPaypalOrder, getWallet, startPaypalCheckout } from "@/lib/offx/server";
import type { Payment, WalletSnapshot } from "@/lib/offx/types";
import { formatNox, relTime, splitNox } from "@/lib/offx/format";
import { formatEuro, NOX_PACKS, type NoxPack } from "@/lib/offx/packs";
import { PAYPAL_RECEIVER, submitPaypalForm } from "@/lib/offx/paypal";
import { assertOnline, cacheGet, cacheSet, useOnline } from "@/lib/offx/offline";
import { cn } from "@/lib/cn";
import { useLan } from "./lan-provider";
import { useT } from "@/lib/offx/settings";

export function WalletView() {
  const lan = useLan();
  const t = useT();
  const [data, setData] = useState<WalletSnapshot | null>(null);
  const [busy, setBusy] = useState(false);
  const [pick, setPick] = useState<NoxPack | null>(null);
  const [paypalWait, setPaypalWait] = useState<string | null>(null);
  const online = useOnline();

  async function reload() {
    try {
      const next = await getWallet();
      setData(next);
      lan.setMe(next.profile);
      await cacheSet("wallet", next);
    } catch {
      const cached = await cacheGet<WalletSnapshot>("wallet");
      if (cached) setData(cached);
      else setData({ profile: lan.me, transactions: [] });
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const flag = params.get("paypal");
    const orderId = params.get("order");
    if (flag === "cancel") {
      toast.message(t("wallet.paypalCancel"));
      window.history.replaceState({}, "", window.location.pathname);
      return;
    }
    if (flag !== "return" || !orderId) return;
    setPaypalWait(orderId);
    let tries = 0;
    let alive = true;
    const tick = async () => {
      try {
        const order = await getPaypalOrder({ data: orderId });
        if (!alive) return;
        if (order?.status === "completed") {
          setPaypalWait(null);
          await reload();
          toast.success(t("wallet.paypalDone"));
          window.history.replaceState({}, "", window.location.pathname);
          return;
        }
      } catch {
        /* still pending */
      }
      tries += 1;
      if (tries < 20) window.setTimeout(() => void tick(), 2000);
      else if (alive) toast.message(t("wallet.paypalPending"));
    };
    void tick();
    return () => {
      alive = false;
    };
  }, []);

  async function buyPaypal(pack: NoxPack) {
    setBusy(true);
    try {
      assertOnline();
      const origin = window.location.origin;
      const checkout = await startPaypalCheckout({
        data: { packId: pack.id, returnOrigin: origin },
      });
      submitPaypalForm(checkout.fields);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "PayPal nicht erreichbar.");
      setBusy(false);
    }
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-lg space-y-4 px-4 py-8 tab-safe">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-28 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  const demo = splitNox("10");

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-6 tab-safe">
      <h2 className="font-display text-2xl tracking-[0.12em]">NOX holen</h2>
      <div className="mt-5 rounded-2xl bg-surface p-5 shadow-[var(--shadow-border)]">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted">
          Dein Stand
        </p>
        <p className="mt-2 font-display text-5xl tracking-wide tabular-nums">
          {formatNox(data.profile.walletBalance)}
        </p>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted">
          10 NOX kosten {formatEuro(0.99)}. Wer {formatNox(demo.gross)} sendet, gibt{" "}
          {formatNox(demo.net)} weiter. {formatNox(demo.fee)} bleiben bei Offchat.
        </p>
      </div>

      {paypalWait && (
        <p className="mt-4 rounded-xl bg-surface px-4 py-3 text-sm leading-relaxed text-muted shadow-[var(--shadow-border)]">
          {t("wallet.paypalWait")}
        </p>
      )}

      <section className="mt-6">
        <h2 className="text-sm font-medium">NOX holen</h2>
        <p className="mt-1 text-xs text-muted">{t("wallet.paypalHint")}</p>
        {!online && (
          <p className="mt-3 flex items-center gap-2 text-sm text-warn">
            <WifiOff className="size-4" />
            Du bist ohne Internet. Packs gehen nur im Tab Online.
          </p>
        )}
        <ul className="mt-3 divide-y divide-border overflow-hidden rounded-xl bg-surface shadow-[var(--shadow-border)]">
          {NOX_PACKS.map((pack) => (
            <li key={pack.id}>
              <button
                type="button"
                disabled={busy || !online}
                onClick={() => setPick(pack)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left disabled:opacity-40"
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">{formatNox(pack.nox)}</span>
                  <span className="text-xs text-muted">
                    {formatEuro(pack.euro / pack.nox)} / NOX
                    {pack.savePct > 0 ? ` · −${pack.savePct} %` : ""}
                  </span>
                </span>
                <span className="text-sm font-medium tabular-nums">{formatEuro(pack.euro)}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="mb-2 text-sm font-medium">Verlauf</h2>
        <ul className="divide-y divide-border rounded-xl bg-surface shadow-[var(--shadow-border)]">
          {data.transactions.length === 0 && (
            <li className="px-4 py-6 text-sm text-muted">Noch keine Bewegungen.</li>
          )}
          {data.transactions.map((tx) => (
            <LedgerRow key={tx.id} tx={tx} meId={data.profile.userId} />
          ))}
        </ul>
      </section>

      {pick && (
        <CheckoutSheet
          pack={pick}
          busy={busy}
          onClose={() => !busy && setPick(null)}
          onPay={() => void buyPaypal(pick)}
        />
      )}
    </div>
  );
}

function CheckoutSheet({
  pack,
  busy,
  onClose,
  onPay,
}: {
  pack: NoxPack;
  busy: boolean;
  onClose: () => void;
  onPay: () => void;
}) {
  const t = useT();
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-bg/70 p-3 lg:items-center">
      <div className="w-full max-w-md rounded-2xl bg-surface p-5 shadow-[var(--shadow-lift)]">
        <p className="font-display text-xl tracking-[0.12em]">PAYPAL</p>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          {formatNox(pack.nox)} für {formatEuro(pack.euro)}
          {pack.savePct > 0 ? ` · ${pack.savePct} % Mengenrabatt` : ""}.
        </p>
        <p className="mt-3 font-display text-4xl tabular-nums">{formatEuro(pack.euro)}</p>
        <p className="mt-3 text-sm leading-relaxed text-muted">{t("wallet.paypalTo")}</p>
        <p className="mt-1 break-all text-sm font-medium">{PAYPAL_RECEIVER}</p>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <Button type="button" variant="secondary" className="h-12 rounded-lg" disabled={busy} onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button
            type="button"
            className="h-12 rounded-lg bg-[#ffc439] text-[#003087] hover:bg-[#f5b82e]"
            disabled={busy}
            onClick={onPay}
          >
            {busy ? "…" : t("wallet.paypalPay")}
          </Button>
        </div>
      </div>
    </div>
  );
}

function LedgerRow({ tx, meId }: { tx: Payment; meId: string }) {
  const incoming =
    tx.kind === "topup" ||
    (tx.kind === "send" && tx.recipientId === meId && tx.status === "completed") ||
    (tx.kind === "request" && tx.senderId === meId && tx.status === "completed");
  const shown =
    incoming && tx.kind !== "topup" && tx.status === "completed" ? tx.net : tx.amount;
  const label =
    tx.kind === "topup"
      ? tx.note || "NOX geholt"
      : tx.kind === "cashout"
        ? "NOX zurück"
        : tx.note || (tx.kind === "request" ? "Anfrage" : "NOX");
  const Icon = incoming ? ArrowDownLeft : ArrowUpRight;
  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <span className="grid size-9 place-items-center rounded-full bg-elevated text-muted">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{label}</p>
        <p className="text-xs text-muted">
          {relTime(tx.createdAt)} ·{" "}
          {tx.status === "completed" ? "fertig" : tx.status === "pending" ? "offen" : "abgelehnt"}
        </p>
      </div>
      <p
        className={cn(
          "text-sm font-medium tabular-nums",
          incoming && tx.status === "completed" ? "text-success" : "text-fg",
        )}
      >
        {incoming && tx.status === "completed"
          ? "+"
          : tx.kind === "cashout" || (tx.kind === "send" && tx.senderId === meId)
            ? "−"
            : ""}
        {formatNox(shown)}
      </p>
    </li>
  );
}