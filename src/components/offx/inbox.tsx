import { PenSquare, Search } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import type { Profile } from "@/lib/offx/types";
import { relTime } from "@/lib/offx/format";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "./avatar";
import { cn } from "@/lib/cn";
import { useLan } from "./lan-provider";

export function Inbox({ activeId }: { activeId?: string }) {
  const lan = useLan();
  const [composer, setComposer] = useState(false);
  const rows = lan.inbox;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between px-4 py-3">
        <h1 className="font-display text-xl tracking-[0.12em]">Chats</h1>
        <button
          type="button"
          className="grid size-11 place-items-center text-fg"
          onClick={() => setComposer(true)}
          aria-label="Neuer Chat"
        >
          <PenSquare className="size-5" />
        </button>
      </div>
      <ul className="flex-1 overflow-y-auto">
        {rows.length === 0 && (
          <li className="px-6 py-16 text-center">
            <p className="text-sm font-medium">Chats in diesem Netz</p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Nur Menschen im selben WLAN — öffentlich oder privat. Tippe auf
              den Stift. Wer Offchat hier geöffnet hat, steht in der Liste.
            </p>
            <button
              type="button"
              className="mt-4 text-sm font-medium text-fg underline-offset-4 hover:underline"
              onClick={() => setComposer(true)}
            >
              Menschen in der Nähe
            </button>
          </li>
        )}
        {rows.map((row) => (
          <li key={row.id}>
            <Link
              to="/c/$conversationId"
              params={{ conversationId: row.id }}
              className={cn(
                "flex items-center gap-3 px-4 py-3 transition-colors duration-150 hover:bg-elevated",
                activeId === row.id && "bg-elevated",
              )}
            >
              <UserAvatar
                name={row.other.displayName}
                hue={row.other.avatarHue}
                src={row.other.avatarUrl}
                system={row.other.isSystem}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className={cn("truncate text-sm", row.unread ? "font-semibold" : "font-medium")}>
                    {row.other.displayName}
                  </p>
                  <span className="shrink-0 text-[11px] text-faint">{relTime(row.lastMessageAt)}</span>
                </div>
                <p className={cn("truncate text-sm", row.unread ? "text-fg" : "text-muted")}>
                  {row.lastMessagePreview}
                </p>
              </div>
              {row.unread && <span className="size-2 shrink-0 rounded-full bg-fg" />}
            </Link>
          </li>
        ))}
      </ul>
      {composer && <NewChat onClose={() => setComposer(false)} />}
    </div>
  );
}

function NewChat({ onClose }: { onClose: () => void }) {
  const lan = useLan();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const people = lan.people;

  const filtered = people.filter((p) => {
    const hay = `${p.displayName} ${p.handle}`.toLowerCase();
    return hay.includes(q.trim().toLowerCase());
  });

  function start(userId: string) {
    const id = lan.openConversation(userId);
    onClose();
    void navigate({
      to: "/c/$conversationId",
      params: { conversationId: id },
    });
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-bg/70 p-3 lg:items-center">
      <div className="flex max-h-[80dvh] w-full max-w-md flex-col rounded-2xl bg-surface p-4 shadow-[var(--shadow-lift)]">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-medium">In diesem Netz</p>
          <button type="button" className="text-sm text-muted" onClick={onClose}>
            Schließen
          </button>
        </div>
        <div className="relative mb-3">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Suchen"
            className="pl-9"
          />
        </div>
        <ul className="flex-1 overflow-y-auto">
          {filtered.length === 0 && (
            <li className="px-2 py-8 text-center text-sm text-muted">
              {people.length === 0
                ? "Niemand sonst in diesem WLAN. Offchat auf einem zweiten Gerät im selben Netz öffnen."
                : "Kein Treffer."}
            </li>
          )}
          {filtered.map((p: Profile) => (
            <li key={p.userId}>
              <button
                type="button"
                onClick={() => start(p.userId)}
                className="flex w-full items-center gap-3 rounded-lg px-1 py-2 text-left hover:bg-elevated"
              >
                <UserAvatar name={p.displayName} hue={p.avatarHue} src={p.avatarUrl} system={p.isSystem} size="sm" />
                <span>
                  <span className="block text-sm font-medium">{p.displayName}</span>
                  <span className="text-xs text-muted">@{p.handle}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
