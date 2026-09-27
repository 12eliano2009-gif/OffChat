import { useState } from "react";
import { GROK_PROVIDERS, authClient, authEnabled, signIn } from "@/lib/auth/client";
import { applyStayChoice, noteStayIntent } from "@/lib/auth/stay";
import { useT } from "@/lib/offx/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

function ProviderIcon({ idp }: { idp: string }) {
  if (idp === "google") {
    return (
      <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
        <path
          fill="currentColor"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="currentColor"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="currentColor"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        />
        <path
          fill="currentColor"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path
        fill="currentColor"
        d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.74l7.727-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"
      />
    </svg>
  );
}

export function AuthForm({ compact = false }: { compact?: boolean }) {
  const t = useT();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [stay, setStay] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onEmail(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      noteStayIntent(stay);
      if (mode === "up") {
        if (password !== confirm) throw new Error("Passwörter stimmen nicht überein.");
        const body = {
          email,
          password,
          name: name.trim() || email.split("@")[0] || "Offchat",
          rememberMe: stay,
        };
        const { error: err } = await authClient.signUp.email(
          body as Parameters<typeof authClient.signUp.email>[0],
        );
        if (err) throw new Error(err.message || "Registrierung fehlgeschlagen.");
      } else {
        const { error: err } = await authClient.signIn.email({
          email,
          password,
          rememberMe: stay,
        });
        if (err) throw new Error(err.message || "Anmeldung fehlgeschlagen.");
      }
      applyStayChoice(stay);
      await authClient.getSession();
      window.location.href = "/";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Etwas ist schiefgelaufen.");
      setBusy(false);
    }
  }

  if (!authEnabled) {
    return <p className="text-sm text-muted">Anmeldung ist deaktiviert.</p>;
  }

  return (
    <div className="w-full space-y-4">
      <label className="flex cursor-pointer items-start gap-3 rounded-lg bg-elevated px-3 py-3 shadow-[var(--shadow-border)]">
        <input
          type="checkbox"
          checked={stay}
          onChange={(e) => setStay(e.target.checked)}
          className="mt-1 size-4 accent-current"
        />
        <span>
          <span className="block text-sm">{t("auth.stay")}</span>
          <span className="mt-0.5 block text-xs leading-relaxed text-faint">{t("auth.stayHint")}</span>
        </span>
      </label>
      <div className="flex flex-col gap-2">
        {GROK_PROVIDERS.map((p) => (
          <Button
            key={p.providerId}
            type="button"
            variant="secondary"
            className="h-12 w-full rounded-lg"
            onClick={() => {
              noteStayIntent(stay);
              void signIn(p.providerId, { callbackURL: "/" });
            }}
          >
            <ProviderIcon idp={p.idp} />
            Weiter mit {p.label}
          </Button>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-[11px] uppercase tracking-[0.18em] text-faint">oder E-Mail</span>
        <Separator className="flex-1" />
      </div>

      <form onSubmit={onEmail} className="space-y-3">
        {mode === "up" && (
          <div className="space-y-1.5">
            <Label htmlFor="offx-name">Name</Label>
            <Input
              id="offx-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              required
            />
          </div>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="offx-email">E-Mail</Label>
          <Input
            id="offx-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="offx-password">Passwort</Label>
          <Input
            id="offx-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === "up" ? "new-password" : "current-password"}
            minLength={8}
            required
          />
        </div>
        {mode === "up" && (
          <div className="space-y-1.5">
            <Label htmlFor="offx-confirm">Passwort bestätigen</Label>
            <Input
              id="offx-confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" className="h-12 w-full rounded-lg" disabled={busy}>
          {busy
            ? "Bitte warten…"
            : mode === "up"
              ? "Konto erstellen"
              : "Mit E-Mail anmelden"}
        </Button>
      </form>

      <button
        type="button"
        className="w-full text-center text-sm text-muted"
        onClick={() => {
          setMode(mode === "up" ? "in" : "up");
          setError(null);
        }}
      >
        {mode === "up" ? "Schon dabei? Anmelden" : "Neu hier? Konto erstellen"}
      </button>
      {!compact && (
        <p className="text-center text-xs text-faint">
          10 NOX = 0,99 €. Beim Senden kommen 70 % an — 30 % gehen an Offchat.
          Die App selbst läuft im lokalen Netz.
        </p>
      )}
    </div>
  );
}
