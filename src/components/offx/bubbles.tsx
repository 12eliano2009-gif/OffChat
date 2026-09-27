import { Button } from "@/components/ui/button";
import { formatNox } from "@/lib/offx/format";
import type { ChatMessage, Payment, Profile } from "@/lib/offx/types";
import { cn } from "@/lib/cn";

function statusTone(status: Payment["status"]): "success" | "warn" | "danger" | "muted" {
  if (status === "completed") return "success";
  if (status === "pending") return "warn";
  if (status === "declined") return "danger";
  return "muted";
}

function statusLabel(status: Payment["status"]): string {
  if (status === "completed") return "Abgeschlossen";
  if (status === "pending") return "Offen";
  return "Abgelehnt";
}

function paymentTitle(p: Payment, meId: string, otherName: string): string {
  const mine = p.senderId === meId;
  if (p.kind === "request") {
    if (p.status === "completed") {
      return mine ? `${otherName} hat gezahlt` : `Du hast gezahlt`;
    }
    if (p.status === "declined") return "Anfrage abgelehnt";
    return mine
      ? `Du forderst ${formatNox(p.amount)}`
      : `${otherName} fordert ${formatNox(p.amount)}`;
  }
  if (p.status === "completed") {
    return mine
      ? `Du hast ${formatNox(p.amount)} gesendet`
      : `${otherName} hat ${formatNox(p.amount)} gesendet`;
  }
  if (p.status === "declined") return "Zahlung abgelehnt";
  return mine
    ? `Du sendest ${formatNox(p.amount)}`
    : `${otherName} sendet dir ${formatNox(p.amount)}`;
}

export function MessageBubble({
  message,
  mine,
  other,
  meId,
  stacked,
  onResolve,
}: {
  message: ChatMessage;
  mine: boolean;
  other: Profile;
  meId: string;
  stacked?: boolean;
  onResolve: (transactionId: string, action: "accept" | "decline") => void;
}) {
  if (message.type === "payment" && message.payment) {
    const p = message.payment;
    const canAct =
      p.status === "pending" &&
      p.recipientId === meId &&
      (p.kind === "send" || p.kind === "request");
    const incomingNet =
      (p.kind === "send" && p.recipientId === meId) ||
      (p.kind === "request" && p.senderId === meId);
    return (
      <div className={cn("flex w-full", mine ? "justify-end" : "justify-start")}>
        <div
          className={cn(
            "w-[min(100%,280px)] rounded-2xl bg-elevated p-4 shadow-[var(--shadow-border)]",
            mine ? "rounded-br-md" : "rounded-bl-md",
            stacked && "mt-1",
          )}
        >
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted">NOX</p>
          <p className="mt-2 font-display text-3xl tracking-wide tabular-nums text-fg">
            {formatNox(p.amount)}
          </p>
          <p className="mt-1 text-sm text-muted">{paymentTitle(p, meId, other.displayName)}</p>
          <p className="mt-2 text-xs leading-relaxed text-muted">
            {incomingNet
              ? `${formatNox(p.net)} kommen an. ${formatNox(p.fee)} gehen an Offchat.`
              : `${formatNox(p.net)} an ${other.displayName}. ${formatNox(p.fee)} an Offchat.`}
          </p>
          {p.note && <p className="mt-1 text-sm text-fg/80">{p.note}</p>}
          <div className="mt-3">
            <StatusChip status={p.status} />
          </div>
          {canAct && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button size="sm" className="h-10 rounded-md" onClick={() => onResolve(p.id, "accept")}>
                {p.kind === "request" ? "Zahlen" : "Annehmen"}
              </Button>
              <Button
                size="sm"
                variant="secondary"
                className="h-10 rounded-md"
                onClick={() => onResolve(p.id, "decline")}
              >
                Ablehnen
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (message.type === "image" && message.imageUrl) {
    return (
      <div className={cn("flex w-full", mine ? "justify-end" : "justify-start")}>
        <img
          src={message.imageUrl}
          alt=""
          className={cn(
            "max-h-72 max-w-[72%] rounded-2xl object-cover",
            mine ? "rounded-br-md" : "rounded-bl-md",
            stacked && "mt-1",
          )}
        />
      </div>
    );
  }

  return (
    <div className={cn("flex w-full", mine ? "justify-end" : "justify-start")}>
      <p
        className={cn(
          "max-w-[78%] rounded-2xl px-3.5 py-2 text-[15px] leading-snug",
          mine
            ? "rounded-br-md bg-bubble text-bubble-fg"
            : "rounded-bl-md bg-incoming text-incoming-fg",
          stacked && "mt-1",
        )}
      >
        {message.body}
      </p>
    </div>
  );
}

function StatusChip({ status }: { status: Payment["status"] }) {
  const tone = statusTone(status);
  const cls =
    tone === "success"
      ? "bg-success/15 text-success"
      : tone === "warn"
        ? "bg-warn/15 text-warn"
        : tone === "danger"
          ? "bg-destructive/15 text-destructive"
          : "bg-elevated text-muted";
  return (
    <span className={cn("inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium", cls)}>
      {statusLabel(status)}
    </span>
  );
}
