import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useP2PRoom, type PeerInfo } from "@/lib/multiplayer";
import { cacheGet, cacheSet } from "@/lib/offx/offline";
import {
  lanConvId,
  lanPeerId,
  readCachedLanNet,
  writeCachedLanNet,
  forcedLanNet,
  type LanNet,
} from "@/lib/offx/lan";
import { useLanBus } from "@/lib/offx/use-lan-bus";
import { netForMode } from "@/lib/offx/mode";
import { useSettings, type ConnMode } from "@/lib/offx/settings";
import { parseAmount, splitNox, toMoney } from "@/lib/offx/format";
import { createPost, deletePost as deletePostCloud } from "@/lib/offx/server";
import {
  mergeCommentMaps,
  useProfileVault,
  type ProfileVault,
  type ProfileVaultApi,
} from "@/lib/offx/vault";
import type {
  ChatMessage,
  Comment,
  ConversationSummary,
  FeedPost,
  Payment,
  PostKeep,
  Profile,
  ThreadPayload,
} from "@/lib/offx/types";

type Wire =
  | { t: "hello"; profile: Profile }
  | { t: "snap"; posts: FeedPost[]; comments: Record<string, Comment[]>; deleted?: string[] }
  | { t: "post"; post: FeedPost }
  | { t: "delete"; postId: string; userId: string }
  | { t: "like"; postId: string; userId: string; liked: boolean }
  | { t: "comment"; comment: Comment }
  | { t: "chat"; message: ChatMessage; profile: Profile }
  | {
      t: "pay-res";
      message: ChatMessage;
      profile: Profile;
      balanceHint?: { userId: string; walletBalance: string };
    };

type LanState = {
  posts: FeedPost[];
  comments: Record<string, Comment[]>;
  threads: Record<string, ChatMessage[]>;
  people: Record<string, Profile>;
  deleted: string[];
};

const emptyState: LanState = { posts: [], comments: {}, threads: {}, people: {}, deleted: [] };

const lanWrites = new Map<string, Promise<unknown>>();
const LAST_NET_KEY = "offchat-last-net";

function writeLan(key: string, value: LanState): Promise<void> {
  const prev = lanWrites.get(key) ?? Promise.resolve();
  const run = prev.catch(() => undefined).then(() => cacheSet(key, value));
  lanWrites.set(key, run);
  return run.then(() => undefined);
}

function noteNetSwitch(netId: string): string | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const prev = localStorage.getItem(LAST_NET_KEY);
    if (prev !== netId) localStorage.setItem(LAST_NET_KEY, netId);
    return prev && prev !== netId ? prev : null;
  } catch {
    return null;
  }
}

type LanApi = {
  me: Profile;
  net: LanNet | null;
  mode: ConnMode;
  joined: boolean;
  peers: PeerInfo[];
  people: Profile[];
  posts: FeedPost[];
  inbox: ConversationSummary[];
  commentsFor: (postId: string) => Comment[];
  getThread: (conversationId: string) => ThreadPayload | null;
  publishPost: (input: {
    caption: string;
    mediaType: "image" | "video";
    mediaUrl: string;
    posterUrl: string | null;
    keep: PostKeep;
  }) => void;
  deletePost: (postId: string) => void;
  toggleLike: (postId: string) => void;
  addComment: (postId: string, body: string) => void;
  openConversation: (otherUserId: string) => string;
  sendText: (conversationId: string, body: string) => ChatMessage[];
  sendImage: (conversationId: string, imageUrl: string) => ChatMessage[];
  sendPayment: (
    conversationId: string,
    kind: "send" | "request",
    amount: string,
    note: string,
  ) => ChatMessage[];
  resolvePayment: (transactionId: string, action: "accept" | "decline") => ChatMessage[];
  setMe: (profile: Profile) => void;
};

const LanContext = createContext<LanApi | null>(null);

export function useLan(): LanApi {
  const ctx = useContext(LanContext);
  if (!ctx) throw new Error("useLan outside LanProvider");
  return ctx;
}

export function LanProvider({
  me: seed,
  onMe,
  children,
}: {
  me: Profile;
  onMe?: (profile: Profile) => void;
  children: ReactNode;
}) {
  const { mode } = useSettings();
  const [me, setMeState] = useState(seed);
  const meRef = useRef(me);
  meRef.current = me;
  const vault = useProfileVault(me.userId);
  const [net, setNet] = useState<LanNet | null>(() =>
    mode === "online" ? forcedLanNet() : mode === "bluetooth" ? null : (readCachedLanNet() ?? null),
  );

  const setMe = useCallback(
    (next: Profile | ((cur: Profile) => Profile)) => {
      const profile = typeof next === "function" ? next(meRef.current) : next;
      meRef.current = profile;
      setMeState(profile);
      vault.stamp(profile);
      void cacheSet("me", profile);
      onMe?.(profile);
    },
    [vault, onMe],
  );

  useEffect(() => {
    setMeState(seed);
    meRef.current = seed;
  }, [seed]);

  useEffect(() => {
    let alive = true;
    const apply = (next: LanNet) => {
      if (!alive) return;
      writeCachedLanNet(next);
      setNet((cur) => (cur?.id === next.id ? (cur ?? next) : next));
    };
    void netForMode(mode).then(apply);
    if (mode !== "local") {
      return () => {
        alive = false;
      };
    }
    const refresh = () => {
      if (document.visibilityState === "hidden") return;
      void netForMode("local").then(apply);
    };
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("online", refresh);
    return () => {
      alive = false;
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("online", refresh);
    };
  }, [mode]);

  const netId = net?.id ?? "";
  useEffect(() => {
    if (!netId) return;
    const prev = noteNetSwitch(netId);
    if (!prev) return;
    void purgeLeftNetwork(prev, me.userId);
  }, [netId, me.userId]);

  if (!net) {
    return (
      <LanContext.Provider value={placeholderApi(me, null, mode, vault, setMe)}>
        {children}
      </LanContext.Provider>
    );
  }
  return (
    <LanMesh key={`${mode}-${net.id}`} me={me} setMe={setMe} net={net} mode={mode} vault={vault}>
      {children}
    </LanMesh>
  );
}

function placeholderApi(
  me: Profile,
  net: LanNet | null,
  mode: ConnMode,
  vault: ProfileVaultApi,
  setMe: (profile: Profile | ((cur: Profile) => Profile)) => void,
): LanApi {
  return {
    me,
    net,
    mode,
    joined: false,
    peers: [],
    people: [],
    posts: vault.vault.posts,
    inbox: [],
    commentsFor: (postId) => vault.vault.comments[postId] ?? [],
    getThread: () => null,
    publishPost: (input) => {
      if (input.keep !== "profile") throw new Error("Kein Netzwerk.");
      const post = buildPost(me, input);
      vault.remember(post);
      persistCloud(post);
    },
    deletePost: (postId) => {
      vault.forget(postId);
      dropCloud(postId);
    },
    toggleLike: () => undefined,
    addComment: (postId, body) => {
      const text = body.trim();
      if (!text) return;
      vault.rememberComment({
        id: crypto.randomUUID(),
        postId,
        author: me,
        body: text.slice(0, 500),
        createdAt: new Date().toISOString(),
      });
    },
    openConversation: () => "",
    sendText: () => [],
    sendImage: () => [],
    sendPayment: () => [],
    resolvePayment: () => [],
    setMe,
  };
}

const BT_ICE: RTCIceServer[] = [];

function LanMesh({
  me,
  setMe,
  net,
  mode,
  vault,
  children,
}: {
  me: Profile;
  setMe: (next: Profile | ((cur: Profile) => Profile)) => void;
  net: LanNet;
  mode: ConnMode;
  vault: ProfileVaultApi;
  children: ReactNode;
}) {
  const [state, setState] = useState<LanState>(emptyState);
  const ready = useRef(false);
  const tabId = useRef(
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `tab-${Math.random().toString(36).slice(2)}`,
  );
  const bcRef = useRef<BroadcastChannel | null>(null);
  const selfId = useMemo(() => lanPeerId(me.userId), [me.userId]);
  const p2p = useP2PRoom({
    room: net.id,
    selfId,
    name: me.displayName.slice(0, 64),
    iceServers: mode === "bluetooth" ? BT_ICE : undefined,
  });

  const persistKey = `lan-${net.id}-${me.userId}`;
  const vaultRef = useRef(vault);
  vaultRef.current = vault;

  useEffect(() => {
    let alive = true;
    void cacheGet<LanState>(persistKey).then((saved) => {
      if (!alive) return;
      const base = saved ? normalizeState(saved) : emptyState;
      setState(hydrateWithVault(base, vaultRef.current.vault, me.userId));
      ready.current = true;
    });
    return () => {
      alive = false;
    };
  }, [persistKey, me.userId]);

  useEffect(() => {
    if (!ready.current) return;
    setState((prev) => hydrateWithVault(prev, vault.vault, me.userId));
  }, [vault.vault, me.userId]);

  useEffect(() => {
    if (!ready.current) return;
    void writeLan(persistKey, state);
  }, [persistKey, state]);

  const peopleById = state.people;
  const sendReliable = p2p.send;
  const meId = me.userId;

  const applyWire = useCallback(
    (data: unknown) => {
      const msg = data as Wire;
      if (!msg || typeof msg !== "object" || !("t" in msg)) return;
      setState((prev) => {
        if (msg.t === "hello") {
          if (msg.profile.userId === meId) return prev;
          return {
            ...prev,
            people: { ...prev.people, [msg.profile.userId]: msg.profile },
          };
        }
        if (msg.t === "snap") {
          const gone = new Set([...prev.deleted, ...(msg.deleted ?? [])]);
          const comments = mergeCommentMaps(msg.comments ?? {}, prev.comments);
          for (const id of gone) delete comments[id];
          return {
            ...prev,
            posts: mergePosts(
              prev.posts.filter((p) => !gone.has(p.id)),
              (msg.posts ?? []).filter((p) => !gone.has(p.id)),
              meId,
            ),
            comments,
            deleted: [...gone].slice(-200),
          };
        }
        if (msg.t === "post") {
          if (prev.deleted.includes(msg.post.id)) return prev;
          return { ...prev, posts: mergePosts(prev.posts, [msg.post], meId) };
        }
        if (msg.t === "delete") {
          const existing = prev.posts.find((p) => p.id === msg.postId);
          if (existing && existing.author.userId !== msg.userId) return prev;
          return dropPost(prev, msg.postId);
        }
        if (msg.t === "like") {
          return {
            ...prev,
            posts: prev.posts.map((p) =>
              p.id !== msg.postId ? p : applyLike(p, msg.userId, msg.liked, meId),
            ),
          };
        }
        if (msg.t === "comment") {
          if (prev.deleted.includes(msg.comment.postId)) return prev;
          const list = prev.comments[msg.comment.postId] ?? [];
          if (list.some((c) => c.id === msg.comment.id)) return prev;
          queueMicrotask(() => vaultRef.current.rememberComment(msg.comment));
          return {
            ...prev,
            comments: {
              ...prev.comments,
              [msg.comment.postId]: [...list, msg.comment],
            },
            posts: prev.posts.map((p) =>
              p.id === msg.comment.postId ? { ...p, commentCount: p.commentCount + 1 } : p,
            ),
            people: {
              ...prev.people,
              [msg.comment.author.userId]: msg.comment.author,
            },
          };
        }
        if (msg.t === "chat" || msg.t === "pay-res") {
          const message = msg.message;
          const list = prev.threads[message.conversationId] ?? [];
          const exists = list.some((m) => m.id === message.id);
          const threads = {
            ...prev.threads,
            [message.conversationId]: exists
              ? list.map((m) => (m.id === message.id ? message : m))
              : [...list, message].slice(-400),
          };
          const people = { ...prev.people };
          if (msg.profile.userId !== meId) people[msg.profile.userId] = msg.profile;
          const tx = message.payment;
          if (
            msg.t === "pay-res" &&
            tx?.status === "declined" &&
            tx.kind === "send" &&
            tx.senderId === meId
          ) {
            queueMicrotask(() =>
              setMe((cur) => ({
                ...cur,
                walletBalance: toMoney(Number(cur.walletBalance) + Number(tx.amount)),
              })),
            );
          }
          if (
            msg.t === "pay-res" &&
            tx?.status === "completed" &&
            tx.kind === "request" &&
            tx.senderId === meId
          ) {
            queueMicrotask(() =>
              setMe((cur) => ({
                ...cur,
                walletBalance: toMoney(Number(cur.walletBalance) + Number(tx.net)),
              })),
            );
          }
          return { ...prev, threads, people };
        }
        return prev;
      });
      if (msg.t === "pay-res" && msg.balanceHint?.userId === meId && msg.balanceHint.walletBalance) {
        setMe((cur) => ({ ...cur, walletBalance: msg.balanceHint!.walletBalance }));
      }
    },
    [meId],
  );

  const bus = useLanBus({ room: net.id, selfId, onEvent: applyWire });

  useEffect(() => p2p.onMessage((_from, data) => applyWire(data)), [p2p, applyWire]);

  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return;
    const ch = new BroadcastChannel(`offx-${net.id}`);
    ch.onmessage = (ev) => {
      const data = ev.data as { tab?: string; msg?: unknown } | undefined;
      if (!data || data.tab === tabId.current) return;
      applyWire(data.msg);
    };
    bcRef.current = ch;
    return () => {
      bcRef.current = null;
      ch.close();
    };
  }, [net.id, applyWire]);

  const fanout = useCallback(
    (payload: Wire, to?: string) => {
      sendReliable(payload, to);
      try {
        bcRef.current?.postMessage({ tab: tabId.current, msg: payload });
      } catch {
        /* channel closed */
      }
      if (!to) bus.post(payload);
    },
    [sendReliable, bus],
  );

  const hello = useCallback(() => {
    fanout({ t: "hello", profile: me });
  }, [me, fanout]);

  useEffect(() => {
    hello();
    const t = window.setInterval(hello, 6000);
    return () => window.clearInterval(t);
  }, [hello]);

  const greeted = useRef(new Set<string>());
  useEffect(() => {
    for (const peer of p2p.peers) {
      if (peer.connectionState !== "connected") continue;
      if (greeted.current.has(peer.id)) continue;
      greeted.current.add(peer.id);
      sendReliable({ t: "hello", profile: me } satisfies Wire, peer.id);
      sendReliable(
        {
          t: "snap",
          posts: state.posts.slice(0, 40),
          comments: state.comments,
          deleted: state.deleted,
        } satisfies Wire,
        peer.id,
      );
    }
  }, [p2p.peers, me, selfId, sendReliable, state.posts, state.comments, state.deleted]);

  const carrySig = useRef("");
  useEffect(() => {
    if (!ready.current) return;
    const mineNetwork = state.posts.filter((p) => p.author.userId === me.userId);
    const mineProfile = vault.vault.posts.filter(
      (p) =>
        p.author.userId === me.userId &&
        p.keep === "profile" &&
        !state.deleted.includes(p.id) &&
        !vault.vault.deleted.includes(p.id),
    );
    const mine = mergePosts(mineNetwork, mineProfile, me.userId);
    const sig = mine.map((p) => p.id).sort().join(",");
    if (!sig || sig === carrySig.current) return;
    carrySig.current = sig;
    const comments: Record<string, Comment[]> = {};
    for (const p of mine) {
      if (state.comments[p.id]) comments[p.id] = state.comments[p.id]!;
    }
    fanout({
      t: "snap",
      posts: mine.slice(0, 40),
      comments,
      deleted: vault.vault.deleted,
    });
  }, [state.posts, state.comments, state.deleted, fanout, me.userId, vault.vault]);

  const people = useMemo(
    () => Object.values(peopleById).filter((p) => p.userId !== me.userId && !p.isSystem),
    [peopleById, me.userId],
  );

  const inbox: ConversationSummary[] = useMemo(() => {
    const rows: ConversationSummary[] = [];
    for (const [id, messages] of Object.entries(state.threads)) {
      const last = messages[messages.length - 1];
      if (!last) continue;
      const otherId =
        last.senderId === me.userId
          ? messages.find((m) => m.senderId !== me.userId)?.senderId
          : last.senderId;
      const other =
        (otherId && peopleById[otherId]) ||
        people.find((p) => lanConvId(me.userId, p.userId) === id);
      if (!other) continue;
      rows.push({
        id,
        other,
        lastMessageAt: last.createdAt,
        lastMessagePreview:
          last.type === "payment" ? "NOX" : last.type === "image" ? "Foto" : last.body.slice(0, 80),
        unread: last.senderId !== me.userId,
      });
    }
    rows.sort((a, b) => (a.lastMessageAt < b.lastMessageAt ? 1 : -1));
    return rows;
  }, [state.threads, peopleById, people, me.userId]);

  const publishPost: LanApi["publishPost"] = (input) => {
    if (input.keep !== "network" && input.keep !== "profile" && input.keep !== "leave") {
      throw new Error("Wähle, wo der Beitrag gespeichert wird.");
    }
    const post = buildPost(me, input);
    if (input.keep === "profile") {
      vault.remember(post);
      persistCloud(post);
    }
    setState((prev) => ({ ...prev, posts: mergePosts(prev.posts, [post], me.userId) }));
    fanout({ t: "post", post });
  };

  const deletePost: LanApi["deletePost"] = (postId) => {
    const post = state.posts.find((p) => p.id === postId);
    if (!post || post.author.userId !== me.userId) return;
    if ((post.keep ?? "profile") === "profile") {
      vault.forget(postId);
      dropCloud(postId);
    }
    setState((prev) => dropPost(prev, postId));
    fanout({ t: "delete", postId, userId: me.userId });
  };

  const toggleLike: LanApi["toggleLike"] = (postId) => {
    const post = state.posts.find((p) => p.id === postId);
    if (!post) return;
    const currently = post.likedBy.includes(me.userId) || post.liked;
    const liked = !currently;
    setState((prev) => ({
      ...prev,
      posts: prev.posts.map((p) => (p.id !== postId ? p : applyLike(p, me.userId, liked, me.userId))),
    }));
    fanout({ t: "like", postId, userId: me.userId, liked });
  };

  const addComment: LanApi["addComment"] = (postId, body) => {
    const text = body.trim();
    if (!text) return;
    const comment: Comment = {
      id: crypto.randomUUID(),
      postId,
      author: me,
      body: text.slice(0, 500),
      createdAt: new Date().toISOString(),
    };
    setState((prev) => ({
      ...prev,
      comments: {
        ...prev.comments,
        [postId]: [...(prev.comments[postId] ?? []), comment],
      },
      posts: prev.posts.map((p) =>
        p.id === postId ? { ...p, commentCount: p.commentCount + 1 } : p,
      ),
    }));
    fanout({ t: "comment", comment });
    const host = state.posts.find((p) => p.id === postId);
    if (host?.author.userId === me.userId && (host.keep ?? "profile") === "profile") {
      vault.rememberComment(comment);
    }
  };

  const openConversation: LanApi["openConversation"] = (otherUserId) => {
    const id = lanConvId(me.userId, otherUserId);
    setState((prev) => ({
      ...prev,
      threads: prev.threads[id] ? prev.threads : { ...prev.threads, [id]: [] },
    }));
    return id;
  };

  const appendChat = (message: ChatMessage): ChatMessage[] => {
    let next: ChatMessage[] = [];
    setState((prev) => {
      const list = prev.threads[message.conversationId] ?? [];
      next = [...list, message].slice(-400);
      return {
        ...prev,
        threads: { ...prev.threads, [message.conversationId]: next },
      };
    });
    fanout({ t: "chat", message, profile: me });
    return next;
  };

  const sendText: LanApi["sendText"] = (conversationId, body) => {
    const text = body.trim();
    if (!text) return state.threads[conversationId] ?? [];
    return appendChat({
      id: crypto.randomUUID(),
      conversationId,
      senderId: me.userId,
      type: "text",
      body: text.slice(0, 4000),
      imageUrl: null,
      createdAt: new Date().toISOString(),
      payment: null,
    });
  };

  const sendImage: LanApi["sendImage"] = (conversationId, imageUrl) =>
    appendChat({
      id: crypto.randomUUID(),
      conversationId,
      senderId: me.userId,
      type: "image",
      body: "",
      imageUrl,
      createdAt: new Date().toISOString(),
      payment: null,
    });

  const sendPayment: LanApi["sendPayment"] = (conversationId, kind, amount, note) => {
    const gross = parseAmount(amount);
    const split = splitNox(gross);
    if (kind === "send" && Number(me.walletBalance) < Number(split.gross)) {
      throw new Error("Nicht genug Guthaben.");
    }
    const other = threadOther(conversationId, me.userId, peopleById, people);
    if (!other) throw new Error("Niemand in diesem Chat.");
    if (kind === "send") {
      setMe((cur) => ({
        ...cur,
        walletBalance: toMoney(Number(cur.walletBalance) - Number(split.gross)),
      }));
    }
    const payment: Payment = {
      id: crypto.randomUUID(),
      conversationId,
      senderId: me.userId,
      recipientId: other.userId,
      amount: split.gross,
      fee: split.fee,
      net: split.net,
      euroPaid: null,
      currency: "NOX",
      note: note.trim().slice(0, 80),
      kind,
      status: "pending",
      createdAt: new Date().toISOString(),
      resolvedAt: null,
    };
    return appendChat({
      id: crypto.randomUUID(),
      conversationId,
      senderId: me.userId,
      type: "payment",
      body: payment.note,
      imageUrl: null,
      createdAt: payment.createdAt,
      payment,
    });
  };

  const resolvePayment: LanApi["resolvePayment"] = (transactionId, action) => {
    let convId = "";
    let nextMsgs: ChatMessage[] = [];
    setState((prev) => {
      const threads = { ...prev.threads };
      for (const [id, list] of Object.entries(threads)) {
        const idx = list.findIndex((m) => m.payment?.id === transactionId);
        if (idx < 0) continue;
        convId = id;
        const msg = list[idx]!;
        const tx = msg.payment;
        if (!tx || tx.status !== "pending") break;
        const completed: Payment = {
          ...tx,
          status: action === "accept" ? "completed" : "declined",
          resolvedAt: new Date().toISOString(),
        };
        const updated: ChatMessage = { ...msg, payment: completed };
        nextMsgs = list.map((m, i) => (i === idx ? updated : m));
        threads[id] = nextMsgs;
        fanout({ t: "pay-res", message: updated, profile: me });
        break;
      }
      return { ...prev, threads };
    });
    const tx = nextMsgs.find((m) => m.payment?.id === transactionId)?.payment;
    if (tx) {
      if (action === "decline" && tx.kind === "send" && tx.senderId === me.userId) {
        setMe((cur) => ({
          ...cur,
          walletBalance: toMoney(Number(cur.walletBalance) + Number(tx.amount)),
        }));
      }
      if (action === "accept" && tx.kind === "send" && tx.recipientId === me.userId) {
        setMe((cur) => ({
          ...cur,
          walletBalance: toMoney(Number(cur.walletBalance) + Number(tx.net)),
        }));
      }
      if (action === "accept" && tx.kind === "request" && tx.recipientId === me.userId) {
        setMe((cur) => ({
          ...cur,
          walletBalance: toMoney(Number(cur.walletBalance) - Number(tx.amount)),
        }));
      }
      if (action === "accept" && tx.kind === "request" && tx.senderId === me.userId) {
        setMe((cur) => ({
          ...cur,
          walletBalance: toMoney(Number(cur.walletBalance) + Number(tx.net)),
        }));
      }
    }
    return nextMsgs.length ? nextMsgs : (state.threads[convId] ?? []);
  };

  const getThread: LanApi["getThread"] = (conversationId) => {
    const other = threadOther(conversationId, me.userId, peopleById, people);
    if (!other) return null;
    return {
      conversationId,
      other,
      me,
      messages: state.threads[conversationId] ?? [],
    };
  };

  const api: LanApi = {
    me,
    net,
    mode,
    joined: p2p.joined,
    peers: p2p.peers,
    people,
    posts: mergePosts(
      state.posts.filter((p) => !vault.vault.deleted.includes(p.id)),
      vault.vault.posts.filter(
        (p) => p.keep === "profile" && !state.deleted.includes(p.id) && !vault.vault.deleted.includes(p.id),
      ),
      me.userId,
    ).map((p) => ({
      ...p,
      liked: (p.likedBy ?? []).includes(me.userId) || p.liked,
      likeCount: Math.max(p.likeCount, (p.likedBy ?? []).length),
    })),
    inbox,
    commentsFor: (postId) => {
      const live = state.comments[postId] ?? [];
      const saved = vault.vault.comments[postId] ?? [];
      if (!saved.length) return live;
      const map = new Map<string, Comment>();
      for (const c of [...saved, ...live]) map.set(c.id, c);
      return [...map.values()];
    },
    getThread,
    publishPost,
    deletePost,
    toggleLike,
    addComment,
    openConversation,
    sendText,
    sendImage,
    sendPayment,
    resolvePayment,
    setMe: (profile) => {
      setMe(profile);
      setState((prev) => ({
        ...prev,
        posts: prev.posts.map((p) =>
          p.author.userId === profile.userId ? { ...p, author: profile } : p,
        ),
      }));
    },
  };

  return (
    <LanContext.Provider value={api}>
      <LeavePurge persistKey={persistKey} userId={me.userId} state={state} fanout={fanout} />
      {children}
    </LanContext.Provider>
  );
}

function LeavePurge({
  persistKey,
  userId,
  state,
  fanout,
}: {
  persistKey: string;
  userId: string;
  state: LanState;
  fanout: (payload: Wire) => void;
}) {
  const stateRef = useRef(state);
  stateRef.current = state;
  const fanoutRef = useRef(fanout);
  fanoutRef.current = fanout;

  useEffect(() => {
    try {
      sessionStorage.removeItem("offchat-reloading");
    } catch {
      /* ignore */
    }
    const mark = () => {
      try {
        sessionStorage.setItem("offchat-reloading", "1");
      } catch {
        /* ignore */
      }
    };
    window.addEventListener("pagehide", mark);
    return () => window.removeEventListener("pagehide", mark);
  }, []);

  useEffect(() => {
    return () => {
      let reloading = false;
      try {
        reloading = sessionStorage.getItem("offchat-reloading") === "1";
      } catch {
        /* ignore */
      }
      if (reloading) return;
      const live = stateRef.current;
      const mine = live.posts.filter((p) => p.keep === "leave" && p.author.userId === userId);
      if (!mine.length) return;
      let next = live;
      for (const p of mine) {
        fanoutRef.current({ t: "delete", postId: p.id, userId });
        next = dropPost(next, p.id);
      }
      void writeLan(persistKey, next);
    };
  }, [persistKey, userId]);

  return null;
}

function dropPost(prev: LanState, postId: string): LanState {
  if (prev.deleted.includes(postId) && !prev.posts.some((p) => p.id === postId)) return prev;
  const comments = { ...prev.comments };
  delete comments[postId];
  return {
    ...prev,
    posts: prev.posts.filter((p) => p.id !== postId),
    comments,
    deleted: prev.deleted.includes(postId) ? prev.deleted : [...prev.deleted, postId].slice(-200),
  };
}

async function purgeLeftNetwork(netId: string, userId: string) {
  const key = `lan-${netId}-${userId}`;
  const saved = await cacheGet<LanState>(key);
  if (!saved?.posts?.length) return;
  const state = normalizeState(saved);
  const mine = state.posts.filter((p) => p.keep === "leave" && p.author.userId === userId);
  if (!mine.length) return;
  let next = state;
  for (const p of mine) next = dropPost(next, p.id);
  await writeLan(key, next);
}

function likedByOf(p: FeedPost): string[] {
  return [...new Set(p.likedBy ?? [])];
}

function applyLike(p: FeedPost, userId: string, liked: boolean, meId: string): FeedPost {
  const set = new Set(likedByOf(p));
  if (liked) set.add(userId);
  else set.delete(userId);
  const likedBy = [...set];
  return {
    ...p,
    likedBy,
    likeCount: likedBy.length,
    liked: likedBy.includes(meId),
  };
}

function mergePosts(current: FeedPost[], incoming: FeedPost[], meId: string): FeedPost[] {
  const map = new Map<string, FeedPost>();
  for (const p of current) map.set(p.id, { ...p, likedBy: likedByOf(p) });
  for (const p of incoming) {
    const prev = map.get(p.id);
    if (!prev) {
      map.set(p.id, {
        ...p,
        likedBy: likedByOf(p),
        liked: likedByOf(p).includes(meId) || p.liked,
        likeCount: Math.max(p.likeCount, likedByOf(p).length),
      });
      continue;
    }
    const likedBy = [...new Set([...likedByOf(prev), ...likedByOf(p)])];
    map.set(p.id, {
      ...p,
      likedBy,
      liked: likedBy.includes(meId),
      likeCount: likedBy.length,
      commentCount: Math.max(prev.commentCount, p.commentCount),
    });
  }
  return [...map.values()]
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, 80);
}

function normalizeState(saved: LanState): LanState {
  return {
    ...saved,
    posts: (saved.posts ?? []).map((p) => ({
      ...p,
      likedBy: likedByOf(p),
    })),
    people: saved.people ?? {},
    threads: saved.threads ?? {},
    comments: saved.comments ?? {},
    deleted: saved.deleted ?? [],
  };
}

function threadOther(
  conversationId: string,
  meId: string,
  peopleById: Record<string, Profile>,
  people: Profile[],
): Profile | null {
  for (const p of Object.values(peopleById)) {
    if (p.userId !== meId && lanConvId(meId, p.userId) === conversationId) return p;
  }
  return people.find((p) => lanConvId(meId, p.userId) === conversationId) ?? null;
}

function buildPost(
  me: Profile,
  input: {
    caption: string;
    mediaType: "image" | "video";
    mediaUrl: string;
    posterUrl: string | null;
    keep: PostKeep;
  },
): FeedPost {
  const id =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return {
    id,
    author: me,
    caption: input.caption.trim().slice(0, 500),
    mediaType: input.mediaType,
    mediaUrl: input.mediaUrl,
    posterUrl: input.posterUrl,
    createdAt: new Date().toISOString(),
    likeCount: 0,
    commentCount: 0,
    liked: false,
    likedBy: [],
    keep: input.keep,
  };
}

function persistCloud(post: FeedPost) {
  void createPost({
    data: {
      id: post.id,
      caption: post.caption,
      mediaType: post.mediaType,
      mediaUrl: post.mediaUrl,
      posterUrl: post.posterUrl,
    },
  }).catch(() => undefined);
}

function dropCloud(postId: string) {
  void deletePostCloud({ data: postId }).catch(() => undefined);
}

function hydrateWithVault(prev: LanState, vault: ProfileVault, meId: string): LanState {
  const gone = new Set([...prev.deleted, ...vault.deleted]);
  const comments = mergeCommentMaps(vault.comments, prev.comments);
  for (const id of gone) delete comments[id];
  return {
    ...prev,
    posts: mergePosts(
      prev.posts.filter((p) => !gone.has(p.id)),
      vault.posts.filter((p) => !gone.has(p.id)),
      meId,
    ),
    comments,
    deleted: [...gone].slice(-200),
  };
}
