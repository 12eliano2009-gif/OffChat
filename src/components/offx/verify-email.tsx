import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { bootstrapMe, requestEmailCode, verifyEmailCode } from "@/lib/offx/server";
import type { Profile } from "@/lib/offx/types";
import { OffxLockup } from "./logo";

export function VerifyEmail({
  onVerified,
}: {
  onVerified: (profile: Profile) => void;
}) {
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [preview, setPreview] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const inputs = useRef<Array<HTMLInputElement | null>>([]);

  async function send() {
    try {
      const res = await requestEmailCode();
      if (res.verified) {
        onVerified(await bootstrapMe());
        return;
      }
      setEmail(res.email);
      setPreview(res.previewCode);
      toast.success("Code ist da.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Code nicht gesendet.");
    }
  }

  useEffect(() => {
    void send();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submit(code: string) {
    setBusy(true);
    try {
      const profile = await verifyEmailCode({ data: code });
      onVerified(profile);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Code ungültig.");
      setBusy(false);
    }
  }

  function onDigit(index: number, raw: string) {
    const d = raw.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = d;
    setDigits(next);
    if (d && index < 5) inputs.current[index + 1]?.focus();
    const code = next.join("");
    if (code.length === 6) void submit(code);
  }

  function onKey(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  }

  function onPaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const next = ["", "", "", "", "", ""];
    for (let i = 0; i < pasted.length; i += 1) next[i] = pasted[i]!;
    setDigits(next);
    if (pasted.length === 6) void submit(pasted);
  }

  return (
    <main className="grid min-h-dvh place-items-center bg-bg px-5 py-10 text-fg">
      <div className="w-full max-w-sm space-y-6">
        <OffxLockup />
        <div>
          <h1 className="font-display text-2xl tracking-[0.12em]">CODE BESTÄTIGEN</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Sechs Ziffern für {email || "deine E-Mail"}. Google-Konten brauchen das nicht.
          </p>
        </div>
        {preview && (
          <div className="rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted">
              Dein Code
            </p>
            <p className="mt-2 font-display text-3xl tracking-[0.28em] tabular-nums">{preview}</p>
            <p className="mt-2 text-xs leading-relaxed text-faint">
              Hier gibt es keinen Mailversand — der Code kommt direkt in Offchat, nicht ins Postfach.
            </p>
          </div>
        )}
        <div className="flex justify-between gap-2" onPaste={onPaste}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => {
                inputs.current[i] = el;
              }}
              inputMode="numeric"
              autoComplete={i === 0 ? "one-time-code" : "off"}
              maxLength={1}
              value={d}
              disabled={busy}
              onChange={(e) => onDigit(i, e.target.value)}
              onKeyDown={(e) => onKey(i, e)}
              className="h-14 w-full rounded-lg bg-surface text-center font-display text-2xl tabular-nums shadow-[var(--shadow-border)] outline-none focus:ring-2 focus:ring-ring"
            />
          ))}
        </div>
        <Button
          type="button"
          variant="secondary"
          className="h-11 w-full rounded-lg"
          disabled={busy}
          onClick={() => void send()}
        >
          Neuen Code holen
        </Button>
      </div>
    </main>
  );
}
