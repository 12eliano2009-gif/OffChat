import { useCallback, useEffect, useState } from "react";
import { cacheGet, cacheSet } from "@/lib/offx/offline";
import { listUserPosts } from "@/lib/offx/server";
import type { Comment, FeedPost, Profile } from "@/lib/offx/types";

export type ProfileVault = {
  posts: FeedPost[];
  comments: Record<string, Comment[]>;
  deleted: string[];
};

export function emptyVault(): ProfileVault {
  return { posts: [], comments: {}, deleted: [] };
}

function vaultKey(userId: string) {
  return `profile-vault-${userId}`;
}

export async function loadVault(userId: string): Promise<ProfileVault> {
  const saved = await cacheGet<ProfileVault>(vaultKey(userId));
  if (!saved) return emptyVault();
  return {
    posts: (saved.posts ?? [])
      .filter((p) => p?.id && p.mediaUrl && (p.keep ?? "profile") === "profile")
      .slice(0, 60),
    comments: saved.comments ?? {},
    deleted: Array.isArray(saved.deleted) ? saved.deleted.slice(-200) : [],
  };
}

export async function saveVault(userId: string, vault: ProfileVault): Promise<void> {
  await cacheSet(vaultKey(userId), {
    posts: vault.posts.filter((p) => p.keep === "profile").slice(0, 60),
    comments: vault.comments,
    deleted: vault.deleted.slice(-200),
  });
}

export function upsertVaultPost(vault: ProfileVault, post: FeedPost): ProfileVault {
  if (post.keep !== "profile") return vault;
  if (vault.deleted.includes(post.id)) return vault;
  const map = new Map(vault.posts.map((p) => [p.id, p]));
  map.set(post.id, { ...post, keep: "profile" });
  return {
    ...vault,
    posts: [...map.values()]
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .slice(0, 60),
  };
}

export function dropVaultPost(vault: ProfileVault, postId: string): ProfileVault {
  const comments = { ...vault.comments };
  delete comments[postId];
  return {
    posts: vault.posts.filter((p) => p.id !== postId),
    comments,
    deleted: vault.deleted.includes(postId)
      ? vault.deleted
      : [...vault.deleted, postId].slice(-200),
  };
}

export function addVaultComment(vault: ProfileVault, comment: Comment): ProfileVault {
  if (vault.deleted.includes(comment.postId)) return vault;
  if (!vault.posts.some((p) => p.id === comment.postId)) return vault;
  const list = vault.comments[comment.postId] ?? [];
  if (list.some((c) => c.id === comment.id)) return vault;
  return {
    ...vault,
    comments: { ...vault.comments, [comment.postId]: [...list, comment] },
    posts: vault.posts.map((p) =>
      p.id === comment.postId
        ? { ...p, commentCount: Math.max(p.commentCount, list.length + 1) }
        : p,
    ),
  };
}

export function stampVaultAuthor(vault: ProfileVault, me: Profile): ProfileVault {
  return {
    ...vault,
    posts: vault.posts.map((p) =>
      p.author.userId === me.userId ? { ...p, author: { ...p.author, ...me } } : p,
    ),
  };
}

export function mergeVaultPosts(vault: ProfileVault, incoming: FeedPost[]): ProfileVault {
  let next = vault;
  for (const p of incoming) {
    if (!p?.id || next.deleted.includes(p.id)) continue;
    next = upsertVaultPost(next, { ...p, keep: "profile" });
  }
  return next;
}

export function mergeCommentMaps(
  a: Record<string, Comment[]>,
  b: Record<string, Comment[]>,
): Record<string, Comment[]> {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  const out: Record<string, Comment[]> = {};
  for (const key of keys) {
    const map = new Map<string, Comment>();
    for (const c of [...(a[key] ?? []), ...(b[key] ?? [])]) map.set(c.id, c);
    out[key] = [...map.values()].sort((x, y) => (x.createdAt < y.createdAt ? -1 : 1));
  }
  return out;
}

export type ProfileVaultApi = {
  vault: ProfileVault;
  remember: (post: FeedPost) => void;
  forget: (postId: string) => void;
  rememberComment: (comment: Comment) => void;
  stamp: (me: Profile) => void;
};

export function useProfileVault(userId: string): ProfileVaultApi {
  const [vault, setVault] = useState<ProfileVault>(emptyVault);

  const commit = useCallback(
    (fn: (prev: ProfileVault) => ProfileVault) => {
      setVault((prev) => {
        const next = fn(prev);
        if (next === prev) return prev;
        void saveVault(userId, next);
        return next;
      });
    },
    [userId],
  );

  useEffect(() => {
    let alive = true;
    void (async () => {
      const local = await loadVault(userId);
      if (!alive) return;
      setVault(local);
      try {
        const cloud = await listUserPosts({ data: userId });
        if (!alive) return;
        setVault((prev) => {
          const merged = mergeVaultPosts(prev, cloud.posts);
          void saveVault(userId, merged);
          return merged;
        });
      } catch {
        /* offline / unsigned */
      }
    })();
    return () => {
      alive = false;
    };
  }, [userId]);

  const remember = useCallback(
    (post: FeedPost) => {
      if (post.keep !== "profile") return;
      commit((prev) => upsertVaultPost(prev, post));
    },
    [commit],
  );
  const forget = useCallback(
    (postId: string) => commit((prev) => dropVaultPost(prev, postId)),
    [commit],
  );
  const rememberComment = useCallback(
    (comment: Comment) => commit((prev) => addVaultComment(prev, comment)),
    [commit],
  );
  const stamp = useCallback(
    (me: Profile) => commit((prev) => stampVaultAuthor(prev, me)),
    [commit],
  );

  return { vault, remember, forget, rememberComment, stamp };
}
