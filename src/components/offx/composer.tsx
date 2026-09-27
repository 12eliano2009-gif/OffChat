import { ImagePlus, Send } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { fileToMedia } from "@/lib/offx/media";
import { useLan } from "./lan-provider";
import type { ChatMessage, Profile } from "@/lib/offx/types";
import { formatNox, splitNox } from "@/lib/offx/format";
import { cn } from "@/lib/cn";
import { OffxMark } from "./logo";
import { EmojiPicker, insertEmoji } from "./emoji-picker";
import { useT } from "@/lib/offx/settings";

export function Composer({
  conversationId,
  other,
  balance,
  onMessages,
}: {
  conversationId: string;
  other: Profile;
  balance: string;
  onMessages: (messages: ChatMessage[]) => void;
}) {
  const lan = useLan();
  const t = useT();
  const [text, setText] = useState("");
  const [payOpen, setPayOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);

  async function send() {
    const body = text.trim();
    if (!body) return;
    setText("");
    try {
      const messages = lan.sendText(conversationId, body);
      onMessages(messages);
    } catch (err) {
      setText(body);
      toast.error(err instanceof Error ? err.message : "Senden fehlgeschlagen.");
    }
  }

  async function onImage(file: File | undefined) {
    if (!file) return;
    try {
      const media = await fileToMedia(file);
      if (media.mediaType !== "image") {
        toast.error("Im Chat bitte ein Bild senden.");
        return;
      }
      const messages = lan.sendImage(conversationId, media.mediaUrl);
      onMessages(messages);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Bild fehlgeschlagen.");
    }
  }

  return (
    <div
      className="border-t border-border bg-bg px-3 pt-2"
      style={{ paddingBottom: "calc(0.6rem + env(safe-area-inset-bottom))" }}
    >
      {payOpen && (
        <PaySheet
          other={other}
          balance={balance}
          onClose={() => setPayOpen(false)}
          onSubmit={async (kind, amount, note) => {
            const messages = lan.sendPayment(conversationId, kind, amount, note);
            onMessages(messages);
            setPayOpen(false);
          }}
        />
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => void onImage(e.target.files?.[0])}
      />
      <div className="flex items-end gap-1.5">
        <button
          type="button"
          className="grid size-11 place-items-center rounded-full text-muted hover:text-fg"
          onClick={() => fileRef.current?.click()}
          aria-label={t("composer.image")}
        >
          <ImagePlus className="size-5" />
        </button>
        <button
          type="button"
          className="grid size-11 place-items-center rounded-full bg-elevated text-fg"
          onClick={() => setPayOpen((v) => !v)}
          aria-label={t("composer.pay")}
        >
          <OffxMark className="h-4 w-5" />
        </button>
        <div className="flex min-h-11 flex-1 items-end rounded-xl bg-elevated px-3 py-1.5 shadow-[var(--shadow-border)]">
          <textarea
            ref={textRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            rows={1}
            placeholder={t("composer.placeholder")}
            className="max-h-28 min-h-8 w-full resize-none bg-transparent py-1.5 text-[15px] text-fg outline-none placeholder:text-faint"
          />
        </div>
        <EmojiPicker
          onPick={(e) => {
            setText((prev) => insertEmoji(prev, e, textRef.current));
            requestAnimationFrame(() => textRef.current?.focus());
          }}
        />
        <button
          type="button"
          className={cn(
            "grid size-11 place-items-center rounded-full",
            text.trim() ? "bg-primary text-primary-foreground" : "text-faint",
          )}
          onClick={() => void send()}
          aria-label={t("composer.send")}
        >
          <Send className="size-4" />
        </button>
      </div>
    </div>
  );
}

function PaySheet({
  other,
  balance,
  onClose,
  onSubmit,
}: {
  other: Profile;
  balance: string;
  onClose: () => void;
  onSubmit: (kind: "send" | "request", amount: string, note: string) => Promise<void>;
}) {
  const [kind, setKind] = useState<"send" | "request">("send");
  const [amount, setAmount] = useState("10");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const n = Number(String(amount).replace(",", "."));
  const split = Number.isFinite(n) && n >= 1 ? splitNox(n) : null;

  async function go() {
    setBusy(true);
    setError(null);
    try {
      await onSubmit(kind, amount, note);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Zahlung fehlgeschlagen.");
      setBusy(false);
    }
  }

  return (
    <div className="mb-3 rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium">NOX · {other.displayName}</p>
        <button type="button" className="text-sm text-muted" onClick={onClose}>
          Schließen
        </button>
      </div>
      <div className="mb-4 grid grid-cols-2 gap-1 rounded-lg bg-elevated p-1">
        {(["send", "request"] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setKind(k)}
            className={cn(
              "h-10 rounded-md text-sm font-medium transition-colors duration-150",
              kind === k ? "bg-primary text-primary-foreground" : "text-muted",
            )}
          >
            {k === "send" ? "Senden" : "Anfordern"}
          </button>
        ))}
      </div>
      <label className="block">
        <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted">
          Betrag
        </span>
        <div className="mt-1 flex items-baseline gap-2">
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d,.]/g, ""))}
            inputMode="decimal"
            className="w-full bg-transparent font-display text-4xl tabular-nums text-fg outline-none"
          />
          <span className="font-display text-2xl tracking-[0.12em] text-muted">NOX</span>
        </div>
      </label>
      {split && (
        <p className="mt-3 text-sm leading-relaxed text-muted">
          {kind === "send" ? (
            <>
              {other.displayName} erhält {formatNox(split.net)}. {formatNox(split.fee)} gehen an
              Offchat.
            </>
          ) : (
            <>
              Du forderst {formatNox(split.gross)} — bei dir kommen {formatNox(split.net)} an.{" "}
              {formatNox(split.fee)} gehen an Offchat.
            </>
          )}
        </p>
      )}
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Verwendungszweck"
        maxLength={80}
        className="mt-3 h-11 w-full rounded-md border border-border bg-elevated px-3 text-sm outline-none placeholder:text-faint focus-visible:ring-2 focus-visible:ring-ring/60"
      />
      <p className="mt-2 text-xs text-muted tabular-nums">Stand {formatNox(balance)}</p>
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
      <Button className="mt-3 h-11 w-full rounded-lg" disabled={busy} onClick={() => void go()}>
        {busy ? "Wird gesendet…" : kind === "send" ? "NOX senden" : "Anfordern"}
      </Button>
    </div>
  );
}
