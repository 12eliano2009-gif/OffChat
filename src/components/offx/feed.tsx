import { Heart, MessageCircle, Play, Trash2, Wifi } from "lucide-react";
import { useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import type { Comment, FeedPost, Profile } from "@/lib/offx/types";
import { relTime } from "@/lib/offx/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "./avatar";
import { cn } from "@/lib/cn";
import { useLan } from "./lan-provider";
import { EmojiPicker } from "./emoji-picker";
import { useT } from "@/lib/offx/settings";

function PostCard({ post }: { post: FeedPost }) {
  const lan = useLan();
  const t = useT();
  const navigate = useNavigate();
  const lastTap = useRef(0);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const comments = lan.commentsFor(post.id);
  const mine = post.author.userId === lan.me.userId;
  const [confirmDelete, setConfirmDelete] = useState(false);

  function onMediaClick() {
    const now = Date.now();
    if (now - lastTap.current < 320) {
      if (!post.liked) lan.toggleLike(post.id);
    }
    lastTap.current = now;
  }

  function submitComment(e: React.FormEvent) {
    e.preventDefault();
    const body = draft.trim();
    if (!body) return;
    lan.addComment(post.id, body);
    setDraft("");
  }

  function messageAuthor() {
    const id = lan.openConversation(post.author.userId);
    void navigate({ to: "/c/$conversationId", params: { conversationId: id } });
  }

  return (
    <article className="border-b border-border pb-5">
      <header className="flex items-center gap-3 px-4 py-3">
        <Link to="/u/$userId" params={{ userId: post.author.userId }}>
          <UserAvatar
            name={post.author.displayName}
            hue={post.author.avatarHue}
            src={post.author.avatarUrl}
            system={post.author.isSystem}
            size="sm"
          />
        </Link>
        <div className="min-w-0 flex-1">
          <Link
            to="/u/$userId"
            params={{ userId: post.author.userId }}
            className="block truncate text-sm font-medium"
          >
            {post.author.displayName}
          </Link>
          <p className="text-xs text-muted">
            @{post.author.handle} · {relTime(post.createdAt)}
          </p>
        </div>
        {mine ? (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="flex h-11 items-center gap-1.5 text-xs font-medium text-muted hover:text-destructive"
            aria-label="Beitrag löschen"
          >
            <Trash2 className="size-4" />
            Löschen
          </button>
        ) : (
          <button
            type="button"
            onClick={messageAuthor}
            className="text-xs font-medium text-muted hover:text-fg"
          >
            Chat
          </button>
        )}
      </header>

      <button type="button" className="relative block w-full" onClick={onMediaClick}>
        {post.mediaType === "video" ? (
          <>
            <video
              src={post.mediaUrl}
              poster={post.posterUrl ?? undefined}
              className="aspect-[4/5] w-full object-cover"
              muted
              loop
              playsInline
              autoPlay
            />
            <span className="pointer-events-none absolute right-3 top-3 grid size-8 place-items-center rounded-full bg-bg/55 text-fg">
              <Play className="size-3.5" fill="currentColor" />
            </span>
          </>
        ) : (
          <img
            src={post.mediaUrl}
            alt={post.caption}
            className="aspect-[4/5] w-full object-cover"
          />
        )}
      </button>

      <div className="flex items-center gap-1 px-3 pt-2">
        <button
          type="button"
          onClick={() => lan.toggleLike(post.id)}
          className="grid size-11 place-items-center"
          aria-label="Gefällt mir"
        >
          <Heart
            className={cn("size-6", post.liked && "fill-destructive text-destructive")}
            strokeWidth={1.7}
          />
        </button>
        <button
          type="button"
          onClick={() => setCommentsOpen(true)}
          className="grid size-11 place-items-center"
          aria-label="Kommentare"
        >
          <MessageCircle className="size-6" strokeWidth={1.7} />
        </button>
      </div>
      <div className="px-4">
        <p className="text-sm font-medium tabular-nums">
          {post.likeCount} {post.likeCount === 1 ? "Like" : "Likes"}
        </p>
        {post.caption && (
          <p className="mt-1 text-sm leading-relaxed">
            <span className="font-medium">{post.author.handle}</span>{" "}
            <span className="text-fg/90">{post.caption}</span>
          </p>
        )}
        {post.commentCount > 0 && (
          <button
            type="button"
            className="mt-1 text-sm text-muted"
            onClick={() => setCommentsOpen(true)}
          >
            {t("feed.comments", { n: post.commentCount })}
          </button>
        )}
      </div>

      {commentsOpen && (
        <div className="mx-4 mt-3 rounded-xl bg-surface p-3 shadow-[var(--shadow-border)]">
          <div className="max-h-48 space-y-2 overflow-y-auto">
            {comments.map((c: Comment) => (
              <p key={c.id} className="text-sm">
                <span className="font-medium">{c.author.handle}</span>{" "}
                <span className="text-fg/90">{c.body}</span>
              </p>
            ))}
            {comments.length === 0 && (
              <p className="text-sm text-muted">{t("feed.noComments")}</p>
            )}
          </div>
          <form onSubmit={submitComment} className="mt-2 flex items-center gap-1">
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={t("feed.comment")}
              className="h-10"
            />
            <EmojiPicker onPick={(e) => setDraft((prev) => prev + e)} />
            <Button type="submit" size="sm" className="h-10 rounded-md px-3">
              {t("composer.send")}
            </Button>
          </form>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-bg/70 p-3 lg:items-center">
          <div className="w-full max-w-sm rounded-2xl bg-surface p-5 shadow-[var(--shadow-lift)]">
            <p className="text-sm font-medium">{t("feed.deleteQ")}</p>
            <p className="mt-1 text-sm leading-relaxed text-muted">{t("feed.deleteBody")}</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button variant="secondary" className="h-11 rounded-lg" onClick={() => setConfirmDelete(false)}>
                Abbrechen
              </Button>
              <Button
                variant="destructive"
                className="h-11 rounded-lg"
                onClick={() => {
                  lan.deletePost(post.id);
                  setConfirmDelete(false);
                }}
              >
                Löschen
              </Button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}

export function Feed() {
  const lan = useLan();
  const t = useT();

  return (
    <div className="mx-auto w-full max-w-lg tab-safe">
      {lan.people.length > 0 && <PeopleStrip people={lan.people} />}
      {lan.posts.length === 0 ? (
        <EmptyFeed
          hasPeople={lan.people.length > 0}
          net={lan.net?.label ?? t("lan.local")}
          joined={lan.joined}
          people={lan.people.length}
        />
      ) : (
        lan.posts.map((post) => <PostCard key={post.id} post={post} />)
      )}
    </div>
  );
}

function PeopleStrip({ people }: { people: Profile[] }) {
  return (
    <div className="no-scrollbar flex gap-4 overflow-x-auto border-b border-border px-4 py-4">
      {people.map((p) => (
        <Link
          key={p.userId}
          to="/u/$userId"
          params={{ userId: p.userId }}
          className="flex w-16 shrink-0 flex-col items-center gap-1"
        >
          <span className="rounded-full p-px ring-1 ring-fg/70">
            <UserAvatar name={p.displayName} hue={p.avatarHue} src={p.avatarUrl} />
          </span>
          <span className="w-full truncate text-center text-[11px] text-muted">{p.handle}</span>
        </Link>
      ))}
    </div>
  );
}

function EmptyFeed({
  hasPeople,
  net,
  joined,
  people,
}: {
  hasPeople: boolean;
  net: string;
  joined: boolean;
  people: number;
}) {
  const t = useT();
  return (
    <div className="flex flex-col items-center px-8 py-16 text-center">
      <span className="grid size-14 place-items-center rounded-full bg-elevated">
        <Wifi className="size-6 text-fg" />
      </span>
      <p className="mt-5 font-display text-2xl tracking-[0.12em]">{t("feed.emptyTitle")}</p>
      <p className="mt-1 text-sm text-muted">{net}</p>
      <p className="mt-3 max-w-xs text-pretty text-sm leading-relaxed text-muted">
        {!joined ? t("feed.searching") : people === 0 ? t("feed.nobody") : hasPeople ? t("feed.searching") : t("feed.nobody")}
      </p>
      <Link
        to="/create"
        className="mt-6 inline-flex h-11 items-center rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground"
      >
        {t("create.title")}
      </Link>
    </div>
  );
}
