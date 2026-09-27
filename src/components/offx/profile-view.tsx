import { useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Camera, Settings, Trash2 } from "lucide-react";
import { UserButton } from "@/lib/auth/gates";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateProfile } from "@/lib/offx/server";
import { fileToAvatar } from "@/lib/offx/media";
import { formatNox } from "@/lib/offx/format";
import { UserAvatar } from "./avatar";
import { InstallButton, InviteButton } from "./install";
import { useLan } from "./lan-provider";
import { useT } from "@/lib/offx/settings";

export function ProfileView({ userId }: { userId?: string }) {
  const lan = useLan();
  const t = useT();
  const navigate = useNavigate();
  const authUser = useCurrentUser();
  const fileRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(lan.me.displayName);
  const [handle, setHandle] = useState(lan.me.handle);
  const [bio, setBio] = useState(lan.me.bio);
  const [photo, setPhoto] = useState<string | null>(lan.me.avatarUrl);
  const [busy, setBusy] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const own = !userId || userId === lan.me.userId;
  const profile = own
    ? lan.me
    : lan.people.find((p) => p.userId === userId) ??
      lan.posts.find((p) => p.author.userId === userId)?.author;
  const posts = lan.posts.filter((p) => {
    if (p.author.userId !== (profile?.userId ?? lan.me.userId)) return false;
    return (p.keep ?? "profile") === "profile";
  });

  if (!profile) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center text-sm text-muted tab-safe">
        Nicht in diesem Netz. Wenn die Person Offchat im selben WLAN öffnet, ist sie hier.
      </div>
    );
  }

  const shown = profile;

  async function onPhoto(file: File | undefined) {
    if (!file) return;
    try {
      const url = await fileToAvatar(file);
      setPhoto(url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Foto ungültig.");
    }
  }

  async function save() {
    setBusy(true);
    const cleanHandle = handle
      .trim()
      .toLowerCase()
      .replace(/^@/, "")
      .replace(/[^a-z0-9_]/g, "")
      .slice(0, 20);
    const local: typeof lan.me = {
      ...lan.me,
      displayName: name.trim().slice(0, 40) || lan.me.displayName,
      handle: cleanHandle.length >= 2 ? cleanHandle : lan.me.handle,
      bio,
      avatarUrl: photo,
    };
    try {
      const next = await updateProfile({
        data: { displayName: name, handle, bio, avatarUrl: photo },
      });
      lan.setMe(next);
      setEditing(false);
      toast.success(t("profile.saved"));
    } catch (err) {
      lan.setMe(local);
      setEditing(false);
      toast.message(err instanceof Error ? err.message : t("profile.savedLocal"));
    } finally {
      setBusy(false);
    }
  }

  function message() {
    const id = lan.openConversation(shown.userId);
    void navigate({
      to: "/c/$conversationId",
      params: { conversationId: id },
    });
  }

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-6 tab-safe">
      <div className="flex items-start gap-4">
        <button
          type="button"
          className="relative shrink-0"
          disabled={!own || !editing}
          onClick={() => editing && fileRef.current?.click()}
        >
          <UserAvatar
            name={editing ? name || shown.displayName : shown.displayName}
            hue={shown.avatarHue}
            src={editing ? photo : shown.avatarUrl}
            system={shown.isSystem}
            size="xl"
          />
          {own && editing && (
            <span className="absolute bottom-0 right-0 grid size-8 place-items-center rounded-full bg-fg text-bg">
              <Camera className="size-3.5" />
            </span>
          )}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => void onPhoto(e.target.files?.[0])}
        />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-medium">{shown.displayName}</h1>
          <p className="text-sm text-muted">@{shown.handle}</p>
          {own && (
            <p className="mt-1 text-sm tabular-nums text-muted">
              {formatNox(shown.walletBalance)}
            </p>
          )}
        </div>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-fg/90">
        {shown.bio || (own ? "Noch keine Bio." : "")}
      </p>
      <p className="mt-2 text-sm text-muted">
        {posts.length === 1
          ? t("profile.postsOne")
          : t("profile.posts", { n: posts.length })}
      </p>
      {own && (
        <p className="mt-1 text-xs leading-relaxed text-faint">{t("profile.carry")}</p>
      )}

      {own && editing && (
        <div className="mt-5 space-y-3 rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]">
          <div className="space-y-1.5">
            <Label htmlFor="offx-nick">Nickname</Label>
            <Input
              id="offx-nick"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={40}
              placeholder="Wie dich Leute sehen"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="offx-handle">Username</Label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-faint">
                @
              </span>
              <Input
                id="offx-handle"
                value={handle}
                onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                maxLength={20}
                className="pl-7"
                placeholder="username"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="offx-bio">Bio</Label>
            <Textarea id="offx-bio" value={bio} onChange={(e) => setBio(e.target.value)} maxLength={140} />
          </div>
          <div className="flex gap-2">
            <Button className="h-11 rounded-md" disabled={busy} onClick={() => void save()}>
              {busy ? "Speichert…" : "Speichern"}
            </Button>
            <Button
              variant="secondary"
              className="h-11 rounded-md"
              disabled={busy}
              onClick={() => {
                setName(lan.me.displayName);
                setHandle(lan.me.handle);
                setBio(lan.me.bio);
                setPhoto(lan.me.avatarUrl);
                setEditing(false);
              }}
            >
              Abbrechen
            </Button>
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {own && !editing && (
          <Button
            variant="secondary"
            className="h-10 rounded-md"
            onClick={() => {
              setName(lan.me.displayName);
              setHandle(lan.me.handle);
              setBio(lan.me.bio);
              setPhoto(lan.me.avatarUrl);
              setEditing(true);
            }}
          >
            Profil bearbeiten
          </Button>
        )}
        {!own && (
          <Button className="h-10 rounded-md" onClick={message}>
            Nachricht
          </Button>
        )}
        {own && (
          <Link
            to="/settings"
            className="inline-flex h-10 items-center gap-2 rounded-md bg-secondary px-3 text-sm font-medium text-secondary-foreground"
          >
            <Settings className="size-4" />
            Einstellungen
          </Link>
        )}
        {own && (
          <div className="ml-auto text-sm">
            <UserButton />
          </div>
        )}
      </div>
      {own && authUser?.primaryEmail && (
        <p className="mt-2 text-xs text-faint">{authUser.primaryEmail}</p>
      )}
      {own && (
        <div className="mt-6 space-y-3 rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
          <p className="text-sm font-medium">Aufs Gerät holen</p>
          <p className="text-xs leading-relaxed text-muted">
            Dann läuft Offchat als App in jedem WLAN — Café, WG, Festival.
          </p>
          <InstallButton />
          <InviteButton handle={shown.handle} />
        </div>
      )}

      <div className="mt-6 grid grid-cols-3 gap-1">
        {posts.length === 0 && (
          <p className="col-span-3 py-10 text-center text-sm text-muted">{t("profile.none")}</p>
        )}
        {posts.map((p) => (
          <div key={p.id} className="relative aspect-square overflow-hidden bg-elevated">
            <Link to="/" className="block size-full">
              <img
                src={p.posterUrl || p.mediaUrl}
                alt={p.caption}
                className="size-full object-cover"
              />
            </Link>
            {own && (
              <button
                type="button"
                className="absolute right-1 top-1 grid size-9 place-items-center rounded-full bg-bg/80 text-fg"
                aria-label="Beitrag löschen"
                onClick={() => setPendingDelete(p.id)}
              >
                <Trash2 className="size-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>

      {pendingDelete && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-bg/70 p-3 lg:items-center">
          <div className="w-full max-w-sm rounded-2xl bg-surface p-5 shadow-[var(--shadow-lift)]">
            <p className="text-sm font-medium">{t("feed.deleteQ")}</p>
            <p className="mt-1 text-sm leading-relaxed text-muted">{t("profile.deleteBody")}</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button
                variant="secondary"
                className="h-11 rounded-lg"
                onClick={() => setPendingDelete(null)}
              >
                Abbrechen
              </Button>
              <Button
                variant="destructive"
                className="h-11 rounded-lg"
                onClick={() => {
                  lan.deletePost(pendingDelete);
                  setPendingDelete(null);
                }}
              >
                Löschen
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
