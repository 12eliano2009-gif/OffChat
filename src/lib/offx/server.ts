import { createServerFn } from "@tanstack/react-start";
import { createHash, randomInt } from "node:crypto";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql, type Sql } from "@/lib/db";
import { iso, parseAmount, splitNox, toBool, toInt, toMoney, TREASURY_ID } from "./format";
import { packById } from "./packs";
import { createPaypalOrder, readPaypalOrder } from "./paypal.server";
import type {
  ChatMessage,
  Comment,
  ConversationSummary,
  FeedPost,
  Payment,
  Profile,
  ThreadPayload,
  WalletSnapshot,
} from "./types";

type ProfileRow = {
  user_id: string;
  display_name: string;
  handle: string;
  avatar_hue: number;
  avatar_url?: string | null;
  bio: string;
  wallet_balance: unknown;
  is_system: boolean;
  email_verified?: unknown;
};

type MessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  type: "text" | "payment" | "image";
  body: string;
  image_url: string | null;
  transaction_id: string | null;
  created_at: unknown;
};

type TxRow = {
  id: string;
  conversation_id: string | null;
  sender_id: string;
  recipient_id: string;
  amount: unknown;
  fee: unknown;
  net: unknown;
  currency: string;
  note: string;
  kind: Payment["kind"];
  status: Payment["status"];
  created_at: unknown;
  resolved_at: unknown;
  euro_paid?: unknown;
};

type FeedRow = {
  id: string;
  author_id: string;
  caption: string;
  media_type: "image" | "video";
  media_url: string;
  poster_url: string | null;
  created_at: unknown;
  like_count: unknown;
  comment_count: unknown;
  liked: unknown;
  user_id: string;
  display_name: string;
  handle: string;
  avatar_hue: number;
  avatar_url?: string | null;
  bio: string;
  wallet_balance: unknown;
  is_system: boolean;
};

function mapProfile(row: ProfileRow): Profile {
  return {
    userId: row.user_id,
    displayName: row.display_name,
    handle: row.handle,
    avatarHue: toInt(row.avatar_hue),
    avatarUrl: row.avatar_url ?? null,
    bio: row.bio ?? "",
    walletBalance: toMoney(row.wallet_balance),
    isSystem: toBool(row.is_system),
    emailVerified: row.email_verified == null ? true : toBool(row.email_verified),
  };
}

function mapPayment(row: TxRow): Payment {
  const amount = toMoney(row.amount);
  const split = splitNox(amount);
  const fee = row.fee == null ? split.fee : toMoney(row.fee);
  const net = row.net == null ? split.net : toMoney(row.net);
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    recipientId: row.recipient_id,
    amount,
    fee,
    net,
    currency: row.currency || "NOX",
    note: row.note ?? "",
    kind: row.kind,
    status: row.status,
    euroPaid: row.euro_paid == null ? null : toMoney(row.euro_paid),
    createdAt: iso(row.created_at),
    resolvedAt: row.resolved_at ? iso(row.resolved_at) : null,
  };
}

function mapFeedRow(r: FeedRow): FeedPost {
  return {
    id: r.id,
    caption: r.caption,
    mediaType: r.media_type,
    mediaUrl: r.media_url,
    posterUrl: r.poster_url,
    createdAt: iso(r.created_at),
    likeCount: toInt(r.like_count),
    commentCount: toInt(r.comment_count),
    liked: toBool(r.liked),
    likedBy: [],
    keep: "profile",
    author: mapProfile({
      user_id: r.user_id,
      display_name: r.display_name,
      handle: r.handle,
      avatar_hue: r.avatar_hue,
      avatar_url: r.avatar_url,
      bio: r.bio,
      wallet_balance: r.wallet_balance,
      is_system: r.is_system,
    }),
  };
}

async function getProfile(sql: Sql, userId: string): Promise<Profile | null> {
  const rows = await sql<ProfileRow>`
    select user_id, display_name, handle, avatar_hue, avatar_url, bio, wallet_balance, is_system, email_verified
    from profiles where user_id = ${userId}
  `;
  return rows[0] ? mapProfile(rows[0]) : null;
}

function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 14);
  return base || "user";
}

function hueFromId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i += 1) h = (h + id.charCodeAt(i) * 17) % 360;
  return h;
}

async function uniqueHandle(sql: Sql, name: string, userId: string): Promise<string> {
  const base = slugify(name);
  const taken = await sql<{ handle: string }>`
    select handle from profiles where handle = ${base} or handle like ${base + "-%"}
  `;
  const set = new Set(taken.map((r) => r.handle));
  if (!set.has(base)) return base;
  const suffix = userId.replace(/[^a-z0-9]/gi, "").slice(-4).toLowerCase() || "x";
  let handle = `${base}-${suffix}`;
  let n = 1;
  while (set.has(handle)) {
    handle = `${base}-${suffix}${n}`;
    n += 1;
  }
  return handle;
}

function hashEmailCode(userId: string, code: string): string {
  return createHash("sha256").update(`offx:${userId}:${code}`).digest("hex");
}

async function shouldAutoVerify(sql: Sql, userId: string): Promise<boolean> {
  if (userId === "dev-user") return true;
  try {
    const flags = await sql.query<{ emailVerified: boolean }>(
      `select "emailVerified" from "user" where "id" = $1`,
      [userId],
    );
    if (flags[0] && toBool(flags[0].emailVerified)) return true;
    const accounts = await sql.query<{ providerId: string }>(
      `select "providerId" from account where "userId" = $1`,
      [userId],
    );
    return accounts.some((a) => a.providerId === "grok-google" || a.providerId === "grok-x");
  } catch {
    return false;
  }
}

async function authIdentity(
  sql: Sql,
  userId: string,
): Promise<{ name: string; email: string | null }> {
  const rows = await sql.query<{ name: string; email: string }>(
    `select "name", "email" from "user" where "id" = $1`,
    [userId],
  );
  if (rows[0]) {
    return {
      name: rows[0].name || rows[0].email?.split("@")[0] || "Offchat",
      email: rows[0].email ?? null,
    };
  }
  return { name: "Offchat", email: null };
}

function pair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

async function getOrCreateConversation(sql: Sql, a: string, b: string): Promise<string> {
  const [p1, p2] = pair(a, b);
  const found = await sql<{ id: string }>`
    select id from conversations where participant_a = ${p1} and participant_b = ${p2}
  `;
  if (found[0]) return found[0].id;
  const id = crypto.randomUUID();
  await sql`
    insert into conversations (id, participant_a, participant_b)
    values (${id}, ${p1}, ${p2})
  `;
  return id;
}

async function insertMessage(
  sql: Sql,
  input: {
    conversationId: string;
    senderId: string;
    type: "text" | "payment" | "image";
    body?: string;
    imageUrl?: string | null;
    transactionId?: string | null;
  },
): Promise<string> {
  const id = crypto.randomUUID();
  await sql`
    insert into messages (id, conversation_id, sender_id, type, body, image_url, transaction_id)
    values (
      ${id},
      ${input.conversationId},
      ${input.senderId},
      ${input.type},
      ${input.body ?? ""},
      ${input.imageUrl ?? null},
      ${input.transactionId ?? null}
    )
  `;
  const preview =
    input.type === "payment"
      ? "NOX"
      : input.type === "image"
        ? "Foto"
        : (input.body ?? "").slice(0, 80);
  await sql`
    update conversations
    set last_message_at = now(), last_message_preview = ${preview}
    where id = ${input.conversationId}
  `;
  return id;
}

async function ensureTreasury(sql: Sql): Promise<void> {
  await sql`
    insert into profiles (user_id, display_name, handle, avatar_hue, bio, wallet_balance, is_system)
    values (
      ${TREASURY_ID},
      ${"Offchat"},
      ${"_nox"},
      ${0},
      ${"NOX treasury."},
      ${"0"}::numeric,
      ${true}
    )
    on conflict (user_id) do nothing
  `;
}

async function requireProfile(sql: Sql, userId: string): Promise<Profile> {
  await ensureTreasury(sql);
  const verified = await shouldAutoVerify(sql, userId);
  const existing = await getProfile(sql, userId);
  if (existing) {
    if (!existing.emailVerified && verified) {
      await sql`
        update profiles set email_verified = true, updated_at = now()
        where user_id = ${userId}
      `;
      return { ...existing, emailVerified: true };
    }
    return existing;
  }
  const ident = await authIdentity(sql, userId);
  const handle = await uniqueHandle(sql, ident.name, userId);
  await sql`
    insert into profiles (user_id, display_name, handle, avatar_hue, bio, wallet_balance, is_system, email_verified)
    values (
      ${userId},
      ${ident.name},
      ${handle},
      ${hueFromId(userId)},
      ${""},
      ${"25.00"}::numeric,
      ${false},
      ${verified}
    )
    on conflict (user_id) do nothing
  `;
  const created = await getProfile(sql, userId);
  if (!created) throw new Error("Profil konnte nicht angelegt werden.");
  return created;
}

function assertMember(userId: string, a: string, b: string) {
  if (userId !== a && userId !== b) throw new Error("Kein Zugriff auf diese Unterhaltung.");
}

async function loadMessages(sql: Sql, conversationId: string): Promise<ChatMessage[]> {
  const rows = await sql<MessageRow>`
    select id, conversation_id, sender_id, type, body, image_url, transaction_id, created_at
    from messages
    where conversation_id = ${conversationId}
    order by created_at asc
  `;
  const txs = await sql<TxRow>`
    select id, conversation_id, sender_id, recipient_id, amount, fee, net, currency, note, kind, status, created_at, resolved_at, euro_paid
    from transactions
    where conversation_id = ${conversationId}
  `;
  const txMap = new Map<string, Payment>();
  for (const tx of txs) txMap.set(tx.id, mapPayment(tx));
  return rows.map((r) => ({
    id: r.id,
    conversationId: r.conversation_id,
    senderId: r.sender_id,
    type: r.type,
    body: r.body,
    imageUrl: r.image_url,
    createdAt: iso(r.created_at),
    payment: r.transaction_id ? (txMap.get(r.transaction_id) ?? null) : null,
  }));
}

async function debit(sql: Sql, userId: string, amount: string): Promise<void> {
  const rows = await sql<{ user_id: string }>`
    update profiles
    set wallet_balance = wallet_balance - ${amount}::numeric, updated_at = now()
    where user_id = ${userId} and wallet_balance >= ${amount}::numeric
    returning user_id
  `;
  if (!rows[0]) throw new Error("Nicht genug Guthaben.");
}

async function credit(sql: Sql, userId: string, amount: string): Promise<void> {
  await sql`
    update profiles
    set wallet_balance = wallet_balance + ${amount}::numeric, updated_at = now()
    where user_id = ${userId}
  `;
}

async function loadWallet(sql: Sql, userId: string): Promise<WalletSnapshot> {
  const profile = await requireProfile(sql, userId);
  const rows = await sql<TxRow>`
    select id, conversation_id, sender_id, recipient_id, amount, fee, net, currency, note, kind, status, created_at, resolved_at, euro_paid
    from transactions
    where sender_id = ${userId} or recipient_id = ${userId}
    order by created_at desc
    limit 80
  `;
  return { profile, transactions: rows.map(mapPayment) };
}

const FEED_SQL = `
  select p.id, p.author_id, p.caption, p.media_type, p.media_url, p.poster_url, p.created_at,
    (select count(*)::int from post_likes pl where pl.post_id = p.id) as like_count,
    (select count(*)::int from post_comments pc where pc.post_id = p.id) as comment_count,
    exists(select 1 from post_likes pl where pl.post_id = p.id and pl.user_id = $1) as liked,
    pr.user_id, pr.display_name, pr.handle, pr.avatar_hue, pr.avatar_url, pr.bio, pr.wallet_balance, pr.is_system
  from posts p
  join profiles pr on pr.user_id = p.author_id
`;

export const bootstrapMe = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    return requireProfile(sql, context.userId);
  });

export const listInbox = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const me = await requireProfile(sql, context.userId);
    const rows = await sql<{
      id: string;
      participant_a: string;
      participant_b: string;
      last_message_at: unknown;
      last_message_preview: string;
      last_read_at: unknown;
    }>`
      select c.id, c.participant_a, c.participant_b, c.last_message_at, c.last_message_preview,
        r.last_read_at
      from conversations c
      left join conversation_reads r
        on r.conversation_id = c.id and r.user_id = ${context.userId}
      where c.participant_a = ${context.userId} or c.participant_b = ${context.userId}
      order by c.last_message_at desc
    `;
    const out: ConversationSummary[] = [];
    for (const row of rows) {
      const otherId = row.participant_a === context.userId ? row.participant_b : row.participant_a;
      const other = await getProfile(sql, otherId);
      if (!other) continue;
      const last = new Date(iso(row.last_message_at)).getTime();
      const read = row.last_read_at ? new Date(iso(row.last_read_at)).getTime() : 0;
      out.push({
        id: row.id,
        other,
        lastMessageAt: iso(row.last_message_at),
        lastMessagePreview: row.last_message_preview,
        unread: last > read,
      });
    }
    return { me, conversations: out };
  });

export const listDirectory = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    await requireProfile(sql, context.userId);
    const rows = await sql<ProfileRow>`
      select user_id, display_name, handle, avatar_hue, bio, wallet_balance, is_system
      from profiles
      where user_id <> ${context.userId} and is_system = false
      order by display_name asc
    `;
    return rows.map(mapProfile);
  });

export const openConversation = createServerFn({ method: "POST" })
  .validator((otherUserId: string) => {
    if (!otherUserId) throw new Error("Kein Kontakt gewählt.");
    return otherUserId;
  })
  .middleware([authMiddleware])
  .handler(async ({ context, data: otherUserId }) => {
    if (otherUserId === context.userId) throw new Error("Das bist du selbst.");
    const sql = await getSql();
    await requireProfile(sql, context.userId);
    const other = await getProfile(sql, otherUserId);
    if (!other) throw new Error("Kontakt nicht gefunden.");
    if (other.isSystem) throw new Error("Dieser Kontakt ist nicht erreichbar.");
    const id = await getOrCreateConversation(sql, context.userId, otherUserId);
    return { conversationId: id };
  });

export const getThread = createServerFn({ method: "POST" })
  .validator((conversationId: string) => conversationId)
  .middleware([authMiddleware])
  .handler(async ({ context, data: conversationId }): Promise<ThreadPayload> => {
    const sql = await getSql();
    const me = await requireProfile(sql, context.userId);
    const conv = await sql<{
      id: string;
      participant_a: string;
      participant_b: string;
    }>`select id, participant_a, participant_b from conversations where id = ${conversationId}`;
    if (!conv[0]) throw new Error("Unterhaltung nicht gefunden.");
    assertMember(context.userId, conv[0].participant_a, conv[0].participant_b);
    const otherId =
      conv[0].participant_a === context.userId ? conv[0].participant_b : conv[0].participant_a;
    const other = await getProfile(sql, otherId);
    if (!other) throw new Error("Kontakt nicht gefunden.");
    await sql`
      insert into conversation_reads (conversation_id, user_id, last_read_at)
      values (${conversationId}, ${context.userId}, now())
      on conflict (conversation_id, user_id)
      do update set last_read_at = now()
    `;
    const messages = await loadMessages(sql, conversationId);
    return { conversationId, other, me, messages };
  });

export const sendText = createServerFn({ method: "POST" })
  .validator((input: { conversationId: string; body: string }) => {
    const body = input.body.trim();
    if (!input.conversationId) throw new Error("Keine Unterhaltung.");
    if (!body) throw new Error("Nachricht ist leer.");
    if (body.length > 4000) throw new Error("Nachricht ist zu lang.");
    return { conversationId: input.conversationId, body };
  })
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await requireProfile(sql, context.userId);
    const conv = await sql<{ participant_a: string; participant_b: string }>`
      select participant_a, participant_b from conversations where id = ${data.conversationId}
    `;
    if (!conv[0]) throw new Error("Unterhaltung nicht gefunden.");
    assertMember(context.userId, conv[0].participant_a, conv[0].participant_b);
    await insertMessage(sql, {
      conversationId: data.conversationId,
      senderId: context.userId,
      type: "text",
      body: data.body,
    });
    return loadMessages(sql, data.conversationId);
  });

export const sendImage = createServerFn({ method: "POST" })
  .validator((input: { conversationId: string; imageUrl: string }) => {
    if (!input.conversationId) throw new Error("Keine Unterhaltung.");
    if (!input.imageUrl.startsWith("data:image/")) throw new Error("Ungültiges Bild.");
    if (input.imageUrl.length > 1_400_000) throw new Error("Bild ist zu groß.");
    return input;
  })
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await requireProfile(sql, context.userId);
    const conv = await sql<{ participant_a: string; participant_b: string }>`
      select participant_a, participant_b from conversations where id = ${data.conversationId}
    `;
    if (!conv[0]) throw new Error("Unterhaltung nicht gefunden.");
    assertMember(context.userId, conv[0].participant_a, conv[0].participant_b);
    await insertMessage(sql, {
      conversationId: data.conversationId,
      senderId: context.userId,
      type: "image",
      imageUrl: data.imageUrl,
    });
    return loadMessages(sql, data.conversationId);
  });

export const sendPayment = createServerFn({ method: "POST" })
  .validator((input: {
    conversationId: string;
    amount: string;
    note: string;
    kind: "send" | "request";
  }) => {
    if (!input.conversationId) throw new Error("Keine Unterhaltung.");
    if (input.kind !== "send" && input.kind !== "request") throw new Error("Ungültiger Typ.");
    const amount = parseAmount(input.amount);
    const note = (input.note ?? "").trim().slice(0, 80);
    return { conversationId: input.conversationId, amount, note, kind: input.kind };
  })
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await requireProfile(sql, context.userId);
    const conv = await sql<{ participant_a: string; participant_b: string }>`
      select participant_a, participant_b from conversations where id = ${data.conversationId}
    `;
    if (!conv[0]) throw new Error("Unterhaltung nicht gefunden.");
    assertMember(context.userId, conv[0].participant_a, conv[0].participant_b);
    const otherId =
      conv[0].participant_a === context.userId ? conv[0].participant_b : conv[0].participant_a;
    const other = await getProfile(sql, otherId);
    if (!other) throw new Error("Kontakt nicht gefunden.");
    if (other.isSystem) throw new Error("Dieser Kontakt ist nicht erreichbar.");

    const split = splitNox(data.amount);
    const txId = crypto.randomUUID();
    const status: Payment["status"] = "pending";

    if (data.kind === "send") {
      await debit(sql, context.userId, split.gross);
    }

    await sql`
      insert into transactions (
        id, conversation_id, sender_id, recipient_id, amount, fee, net, currency, note, kind, status, resolved_at
      ) values (
        ${txId},
        ${data.conversationId},
        ${context.userId},
        ${otherId},
        ${split.gross}::numeric,
        ${split.fee}::numeric,
        ${split.net}::numeric,
        ${"NOX"},
        ${data.note},
        ${data.kind},
        ${status},
        ${null}
      )
    `;
    await insertMessage(sql, {
      conversationId: data.conversationId,
      senderId: context.userId,
      type: "payment",
      body: data.note,
      transactionId: txId,
    });
    return loadMessages(sql, data.conversationId);
  });

export const resolvePayment = createServerFn({ method: "POST" })
  .validator((input: { transactionId: string; action: "accept" | "decline" }) => {
    if (!input.transactionId) throw new Error("Keine Transaktion.");
    if (input.action !== "accept" && input.action !== "decline") {
      throw new Error("Ungültige Aktion.");
    }
    return input;
  })
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await requireProfile(sql, context.userId);
    const rows = await sql<TxRow>`
      select id, conversation_id, sender_id, recipient_id, amount, fee, net, currency, note, kind, status, created_at, resolved_at, euro_paid
      from transactions where id = ${data.transactionId}
    `;
    const tx = rows[0];
    if (!tx) throw new Error("Transaktion nicht gefunden.");
    if (tx.status !== "pending") throw new Error("Transaktion ist nicht mehr offen.");
    if (!tx.conversation_id) throw new Error("Keine Unterhaltung.");

    const amount = toMoney(tx.amount);
    const split = splitNox(amount);
    const fee = tx.fee == null ? split.fee : toMoney(tx.fee);
    const net = tx.net == null ? split.net : toMoney(tx.net);
    await ensureTreasury(sql);

    if (data.action === "decline") {
      if (tx.kind === "send") {
        if (tx.recipient_id !== context.userId) throw new Error("Nur der Empfänger kann ablehnen.");
        await credit(sql, tx.sender_id, amount);
      } else if (tx.recipient_id !== context.userId) {
        throw new Error("Nur die angefragte Person kann ablehnen.");
      }
      await sql`
        update transactions set status = ${"declined"}, resolved_at = now()
        where id = ${tx.id}
      `;
    } else if (tx.kind === "send") {
      if (tx.recipient_id !== context.userId) throw new Error("Nur der Empfänger kann annehmen.");
      await credit(sql, context.userId, net);
      if (Number(fee) > 0) await credit(sql, TREASURY_ID, fee);
      await sql`
        update transactions set status = ${"completed"}, resolved_at = now()
        where id = ${tx.id}
      `;
    } else {
      if (tx.recipient_id !== context.userId) throw new Error("Nur du kannst zahlen.");
      await debit(sql, context.userId, amount);
      await credit(sql, tx.sender_id, net);
      if (Number(fee) > 0) await credit(sql, TREASURY_ID, fee);
      await sql`
        update transactions set status = ${"completed"}, resolved_at = now()
        where id = ${tx.id}
      `;
    }
    return loadMessages(sql, tx.conversation_id);
  });

export const listFeed = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    await requireProfile(sql, context.userId);
    const rows = await sql.query<FeedRow>(
      `${FEED_SQL} order by p.created_at desc limit 60`,
      [context.userId],
    );
    return rows.map(mapFeedRow);
  });

export const listUserPosts = createServerFn({ method: "POST" })
  .validator((userId: string) => userId)
  .middleware([authMiddleware])
  .handler(async ({ context, data: userId }) => {
    const sql = await getSql();
    await requireProfile(sql, context.userId);
    const profile = await getProfile(sql, userId);
    if (!profile) throw new Error("Profil nicht gefunden.");
    const rows = await sql.query<FeedRow>(
      `${FEED_SQL} where p.author_id = $2 order by p.created_at desc limit 60`,
      [context.userId, userId],
    );
    return { profile, posts: rows.map(mapFeedRow) };
  });

export const createPost = createServerFn({ method: "POST" })
  .validator((input: {
    id?: string;
    caption: string;
    mediaType: "image" | "video";
    mediaUrl: string;
    posterUrl?: string | null;
  }) => {
    const caption = (input.caption ?? "").trim().slice(0, 500);
    if (input.mediaType !== "image" && input.mediaType !== "video") {
      throw new Error("Ungültiger Medientyp.");
    }
    const okImage =
      input.mediaUrl.startsWith("data:image/") || input.mediaUrl.startsWith("/feed/");
    const okVideo =
      input.mediaUrl.startsWith("data:video/") || input.mediaUrl.startsWith("/feed/");
    if (input.mediaType === "image" && !okImage) throw new Error("Ungültiges Bild.");
    if (input.mediaType === "video" && !okVideo) throw new Error("Ungültiges Video.");
    if (input.mediaUrl.length > 3_200_000) throw new Error("Datei ist zu groß.");
    const id =
      typeof input.id === "string" && /^[0-9a-f-]{16,64}$/i.test(input.id)
        ? input.id
        : crypto.randomUUID();
    return {
      id,
      caption,
      mediaType: input.mediaType,
      mediaUrl: input.mediaUrl,
      posterUrl: input.posterUrl ?? null,
    };
  })
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await requireProfile(sql, context.userId);
    await sql`
      insert into posts (id, author_id, caption, media_type, media_url, poster_url)
      values (${data.id}, ${context.userId}, ${data.caption}, ${data.mediaType}, ${data.mediaUrl}, ${data.posterUrl})
      on conflict (id) do update
        set caption = excluded.caption,
            media_url = excluded.media_url,
            poster_url = excluded.poster_url
        where posts.author_id = ${context.userId}
    `;
    return { id: data.id };
  });

export const deletePost = createServerFn({ method: "POST" })
  .validator((postId: string) => {
    if (!postId) throw new Error("Kein Beitrag.");
    return postId;
  })
  .middleware([authMiddleware])
  .handler(async ({ context, data: postId }) => {
    const sql = await getSql();
    await requireProfile(sql, context.userId);
    await sql`
      delete from posts where id = ${postId} and author_id = ${context.userId}
    `;
    return { ok: true as const };
  });

export const toggleLike = createServerFn({ method: "POST" })
  .validator((postId: string) => postId)
  .middleware([authMiddleware])
  .handler(async ({ context, data: postId }) => {
    const sql = await getSql();
    await requireProfile(sql, context.userId);
    const existing = await sql<{ post_id: string }>`
      select post_id from post_likes where post_id = ${postId} and user_id = ${context.userId}
    `;
    if (existing[0]) {
      await sql`delete from post_likes where post_id = ${postId} and user_id = ${context.userId}`;
      return { liked: false };
    }
    await sql`
      insert into post_likes (post_id, user_id) values (${postId}, ${context.userId})
      on conflict do nothing
    `;
    return { liked: true };
  });

export const listComments = createServerFn({ method: "POST" })
  .validator((postId: string) => postId)
  .middleware([authMiddleware])
  .handler(async ({ context, data: postId }): Promise<Comment[]> => {
    const sql = await getSql();
    await requireProfile(sql, context.userId);
    const rows = await sql<{
      id: string;
      post_id: string;
      body: string;
      created_at: unknown;
      user_id: string;
      display_name: string;
      handle: string;
      avatar_hue: number;
      bio: string;
      wallet_balance: unknown;
      is_system: boolean;
    }>`
      select c.id, c.post_id, c.body, c.created_at,
        pr.user_id, pr.display_name, pr.handle, pr.avatar_hue, pr.avatar_url, pr.bio, pr.wallet_balance, pr.is_system
      from post_comments c
      join profiles pr on pr.user_id = c.author_id
      where c.post_id = ${postId}
      order by c.created_at asc
    `;
    return rows.map((r) => ({
      id: r.id,
      postId: r.post_id,
      body: r.body,
      createdAt: iso(r.created_at),
      author: mapProfile({
        user_id: r.user_id,
        display_name: r.display_name,
        handle: r.handle,
        avatar_hue: r.avatar_hue,
        bio: r.bio,
        wallet_balance: r.wallet_balance,
        is_system: r.is_system,
      }),
    }));
  });

export const addComment = createServerFn({ method: "POST" })
  .validator((input: { postId: string; body: string }) => {
    const body = input.body.trim();
    if (!input.postId) throw new Error("Kein Beitrag.");
    if (!body) throw new Error("Kommentar ist leer.");
    if (body.length > 500) throw new Error("Kommentar ist zu lang.");
    return { postId: input.postId, body };
  })
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await requireProfile(sql, context.userId);
    const id = crypto.randomUUID();
    await sql`
      insert into post_comments (id, post_id, author_id, body)
      values (${id}, ${data.postId}, ${context.userId}, ${data.body})
    `;
    return { id };
  });

export const updateProfile = createServerFn({ method: "POST" })
  .validator((input: { displayName: string; handle: string; bio: string; avatarUrl?: string | null }) => {
    const displayName = input.displayName.trim().slice(0, 40);
    if (displayName.length < 2) throw new Error("Nickname ist zu kurz.");
    const handle = input.handle
      .trim()
      .toLowerCase()
      .replace(/^@/, "")
      .replace(/[^a-z0-9_]/g, "")
      .slice(0, 20);
    if (handle.length < 2) throw new Error("Username: mind. 2 Zeichen, nur a–z, 0–9, _.");
    const avatarUrl = input.avatarUrl === undefined ? undefined : input.avatarUrl;
    if (avatarUrl && (typeof avatarUrl !== "string" || avatarUrl.length > 400_000)) {
      throw new Error("Profilbild ist zu groß.");
    }
    if (avatarUrl && !avatarUrl.startsWith("data:image/")) {
      throw new Error("Profilbild ungültig.");
    }
    return { displayName, handle, bio: input.bio.trim().slice(0, 140), avatarUrl };
  })
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await requireProfile(sql, context.userId);
    const clash = await sql<{ user_id: string }>`
      select user_id from profiles
      where handle = ${data.handle} and user_id <> ${context.userId}
      limit 1
    `;
    if (clash[0]) throw new Error(`@${data.handle} ist schon vergeben.`);
    if (data.avatarUrl === undefined) {
      await sql`
        update profiles
        set display_name = ${data.displayName}, handle = ${data.handle}, bio = ${data.bio}, updated_at = now()
        where user_id = ${context.userId}
      `;
    } else {
      await sql`
        update profiles
        set display_name = ${data.displayName},
            handle = ${data.handle},
            bio = ${data.bio},
            avatar_url = ${data.avatarUrl},
            updated_at = now()
        where user_id = ${context.userId}
      `;
    }
    return requireProfile(sql, context.userId);
  });

export const getWallet = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<WalletSnapshot> => {
    const sql = await getSql();
    return loadWallet(sql, context.userId);
  });

export const topUp = createServerFn({ method: "POST" })
  .validator((input: { packId: string; holder: string; last4: string; brand: string; expMonth: number; expYear: number }) => {
    const pack = packById(input.packId);
    if (!pack) throw new Error("Unbekanntes Pack.");
    const holder = String(input.holder ?? "").trim();
    if (holder.length < 3) throw new Error("Name auf der Karte fehlt.");
    const last4 = String(input.last4 ?? "").replace(/\D/g, "");
    if (!/^\d{4}$/.test(last4)) throw new Error("Zahlung unvollständig.");
    const expMonth = Number(input.expMonth);
    const expYear = Number(input.expYear);
    const now = new Date();
    if (
      !Number.isInteger(expMonth) ||
      !Number.isInteger(expYear) ||
      expMonth < 1 ||
      expMonth > 12 ||
      expYear * 12 + (expMonth - 1) < now.getFullYear() * 12 + now.getMonth()
    ) {
      throw new Error("Karte ist abgelaufen.");
    }
    const brand = String(input.brand ?? "card").slice(0, 16);
    return { pack, holder: holder.slice(0, 48), last4, brand, expMonth, expYear };
  })
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await requireProfile(sql, context.userId);
    const { pack } = data;
    const amount = pack.nox.toFixed(2);
    const euro = pack.euro.toFixed(2);
    await credit(sql, context.userId, amount);
    const id = crypto.randomUUID();
    const note = `${pack.nox} NOX · Karte ••${data.last4}`;
    await sql`
      insert into transactions (
        id, sender_id, recipient_id, amount, fee, net, currency, note, kind, status, resolved_at, euro_paid
      )
      values (
        ${id}, ${context.userId}, ${context.userId}, ${amount}::numeric,
        ${"0"}::numeric, ${amount}::numeric, ${"NOX"}, ${note},
        ${"topup"}, ${"completed"}, now(), ${euro}::numeric
      )
    `;
    return loadWallet(sql, context.userId);
  });

export const requestEmailCode = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const me = await requireProfile(sql, context.userId);
    if (me.emailVerified) return { verified: true as const, email: null as string | null, previewCode: null as string | null };
    const ident = await authIdentity(sql, context.userId);
    const recent = await sql<{ created_at: unknown }>`
      select created_at from email_codes where user_id = ${context.userId}
    `;
    if (recent[0]) {
      const age = Date.now() - new Date(iso(recent[0].created_at)).getTime();
      if (age < 20_000) throw new Error("Bitte kurz warten, dann neu anfordern.");
    }
    const code = String(randomInt(100000, 1000000));
    const hash = hashEmailCode(context.userId, code);
    await sql`
      insert into email_codes (user_id, code_hash, expires_at, created_at, attempts)
      values (${context.userId}, ${hash}, now() + interval '15 minutes', now(), 0)
      on conflict (user_id) do update
        set code_hash = excluded.code_hash,
            expires_at = excluded.expires_at,
            created_at = now(),
            attempts = 0
    `;
    return { verified: false as const, email: ident.email, previewCode: code };
  });

export const verifyEmailCode = createServerFn({ method: "POST" })
  .validator((code: string) => {
    const clean = code.replace(/\s/g, "");
    if (!/^\d{6}$/.test(clean)) throw new Error("Sechs Ziffern, bitte.");
    return clean;
  })
  .middleware([authMiddleware])
  .handler(async ({ context, data: code }) => {
    const sql = await getSql();
    await requireProfile(sql, context.userId);
    const rows = await sql<{ code_hash: string; expires_at: unknown; attempts: unknown }>`
      select code_hash, expires_at, attempts from email_codes where user_id = ${context.userId}
    `;
    const row = rows[0];
    if (!row) throw new Error("Kein Code offen. Fordere einen neuen an.");
    if (new Date(iso(row.expires_at)).getTime() < Date.now()) {
      throw new Error("Code ist abgelaufen.");
    }
    if (toInt(row.attempts) >= 8) throw new Error("Zu viele Versuche. Fordere einen neuen Code an.");
    const hash = hashEmailCode(context.userId, code);
    if (hash !== row.code_hash) {
      await sql`
        update email_codes set attempts = attempts + 1 where user_id = ${context.userId}
      `;
      throw new Error("Code stimmt nicht.");
    }
    await sql`
      update profiles set email_verified = true, updated_at = now() where user_id = ${context.userId}
    `;
    await sql`delete from email_codes where user_id = ${context.userId}`;
    return requireProfile(sql, context.userId);
  });

export const cashOut = createServerFn({ method: "POST" })
  .validator((amount: string) => parseAmount(amount))
  .middleware([authMiddleware])
  .handler(async ({ context, data: amount }) => {
    const sql = await getSql();
    await requireProfile(sql, context.userId);
    await debit(sql, context.userId, amount);
    const id = crypto.randomUUID();
    await sql`
      insert into transactions (id, sender_id, recipient_id, amount, note, kind, status, resolved_at)
      values (
        ${id}, ${context.userId}, ${context.userId}, ${amount}::numeric,
        ${"Auszahlung auf Bank •• 4281"}, ${"cashout"}, ${"completed"}, now()
      )
    `;
    return loadWallet(sql, context.userId);
  });

export const startPaypalCheckout = createServerFn({ method: "POST" })
  .validator((input: { packId: string; returnOrigin: string }) => {
    const packId = (input?.packId ?? "").trim();
    const returnOrigin = (input?.returnOrigin ?? "").trim();
    if (!packId) throw new Error("Pack fehlt.");
    if (!returnOrigin) throw new Error("Rückkehr-Adresse fehlt.");
    return { packId, returnOrigin };
  })
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await requireProfile(sql, context.userId);
    return createPaypalOrder(context.userId, data.packId, data.returnOrigin);
  });

export const getPaypalOrder = createServerFn({ method: "POST" })
  .validator((orderId: string) => {
    const id = (orderId ?? "").trim();
    if (!/^[0-9a-f-]{16,64}$/i.test(id)) throw new Error("Bestellung fehlt.");
    return id;
  })
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => readPaypalOrder(context.userId, data));
