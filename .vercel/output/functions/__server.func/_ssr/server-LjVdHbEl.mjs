import { r as createServerFn } from "./ssr.mjs";
import { t as createServerRpc } from "./createServerRpc-CcvdN_gc.mjs";
import { c as iso, f as splitNox, h as toMoney, l as packById, m as toInt, n as TREASURY_ID, p as toBool, r as authMiddleware, u as parseAmount } from "./packs-txKK3gaA.mjs";
import { r as getSql } from "./db-DXXzCag8.mjs";
import { createHash, randomInt } from "node:crypto";
//#region node_modules/.nitro/vite/services/ssr/assets/server-LjVdHbEl.js
function mapProfile(row) {
	return {
		userId: row.user_id,
		displayName: row.display_name,
		handle: row.handle,
		avatarHue: toInt(row.avatar_hue),
		avatarUrl: row.avatar_url ?? null,
		bio: row.bio ?? "",
		walletBalance: toMoney(row.wallet_balance),
		isSystem: toBool(row.is_system),
		emailVerified: row.email_verified == null ? true : toBool(row.email_verified)
	};
}
function mapPayment(row) {
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
		resolvedAt: row.resolved_at ? iso(row.resolved_at) : null
	};
}
function mapFeedRow(r) {
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
		author: mapProfile({
			user_id: r.user_id,
			display_name: r.display_name,
			handle: r.handle,
			avatar_hue: r.avatar_hue,
			avatar_url: r.avatar_url,
			bio: r.bio,
			wallet_balance: r.wallet_balance,
			is_system: r.is_system
		})
	};
}
async function getProfile(sql, userId) {
	const rows = await sql`
    select user_id, display_name, handle, avatar_hue, avatar_url, bio, wallet_balance, is_system, email_verified
    from profiles where user_id = ${userId}
  `;
	return rows[0] ? mapProfile(rows[0]) : null;
}
function slugify(name) {
	return name.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "").replace(/[^a-z0-9]+/g, "").slice(0, 14) || "user";
}
function hueFromId(id) {
	let h = 0;
	for (let i = 0; i < id.length; i += 1) h = (h + id.charCodeAt(i) * 17) % 360;
	return h;
}
async function uniqueHandle(sql, name, userId) {
	const base = slugify(name);
	const taken = await sql`
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
function hashEmailCode(userId, code) {
	return createHash("sha256").update(`offx:${userId}:${code}`).digest("hex");
}
async function shouldAutoVerify(sql, userId) {
	if (userId === "dev-user") return true;
	try {
		const flags = await sql.query(`select "emailVerified" from "user" where "id" = $1`, [userId]);
		if (flags[0] && toBool(flags[0].emailVerified)) return true;
		return (await sql.query(`select "providerId" from account where "userId" = $1`, [userId])).some((a) => a.providerId === "grok-google" || a.providerId === "grok-x");
	} catch {
		return false;
	}
}
async function authIdentity(sql, userId) {
	const rows = await sql.query(`select "name", "email" from "user" where "id" = $1`, [userId]);
	if (rows[0]) return {
		name: rows[0].name || rows[0].email?.split("@")[0] || "Offchat",
		email: rows[0].email ?? null
	};
	return {
		name: "Offchat",
		email: null
	};
}
function pair(a, b) {
	return a < b ? [a, b] : [b, a];
}
async function getOrCreateConversation(sql, a, b) {
	const [p1, p2] = pair(a, b);
	const found = await sql`
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
async function insertMessage(sql, input) {
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
	await sql`
    update conversations
    set last_message_at = now(), last_message_preview = ${input.type === "payment" ? "NOX" : input.type === "image" ? "Foto" : (input.body ?? "").slice(0, 80)}
    where id = ${input.conversationId}
  `;
	return id;
}
async function ensureTreasury(sql) {
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
async function requireProfile(sql, userId) {
	await ensureTreasury(sql);
	const verified = await shouldAutoVerify(sql, userId);
	const existing = await getProfile(sql, userId);
	if (existing) {
		if (!existing.emailVerified && verified) {
			await sql`
        update profiles set email_verified = true, updated_at = now()
        where user_id = ${userId}
      `;
			return {
				...existing,
				emailVerified: true
			};
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
function assertMember(userId, a, b) {
	if (userId !== a && userId !== b) throw new Error("Kein Zugriff auf diese Unterhaltung.");
}
async function loadMessages(sql, conversationId) {
	const rows = await sql`
    select id, conversation_id, sender_id, type, body, image_url, transaction_id, created_at
    from messages
    where conversation_id = ${conversationId}
    order by created_at asc
  `;
	const txs = await sql`
    select id, conversation_id, sender_id, recipient_id, amount, fee, net, currency, note, kind, status, created_at, resolved_at, euro_paid
    from transactions
    where conversation_id = ${conversationId}
  `;
	const txMap = /* @__PURE__ */ new Map();
	for (const tx of txs) txMap.set(tx.id, mapPayment(tx));
	return rows.map((r) => ({
		id: r.id,
		conversationId: r.conversation_id,
		senderId: r.sender_id,
		type: r.type,
		body: r.body,
		imageUrl: r.image_url,
		createdAt: iso(r.created_at),
		payment: r.transaction_id ? txMap.get(r.transaction_id) ?? null : null
	}));
}
async function debit(sql, userId, amount) {
	if (!(await sql`
    update profiles
    set wallet_balance = wallet_balance - ${amount}::numeric, updated_at = now()
    where user_id = ${userId} and wallet_balance >= ${amount}::numeric
    returning user_id
  `)[0]) throw new Error("Nicht genug Guthaben.");
}
async function credit(sql, userId, amount) {
	await sql`
    update profiles
    set wallet_balance = wallet_balance + ${amount}::numeric, updated_at = now()
    where user_id = ${userId}
  `;
}
async function loadWallet(sql, userId) {
	return {
		profile: await requireProfile(sql, userId),
		transactions: (await sql`
    select id, conversation_id, sender_id, recipient_id, amount, fee, net, currency, note, kind, status, created_at, resolved_at, euro_paid
    from transactions
    where sender_id = ${userId} or recipient_id = ${userId}
    order by created_at desc
    limit 80
  `).map(mapPayment)
	};
}
var FEED_SQL = `
  select p.id, p.author_id, p.caption, p.media_type, p.media_url, p.poster_url, p.created_at,
    (select count(*)::int from post_likes pl where pl.post_id = p.id) as like_count,
    (select count(*)::int from post_comments pc where pc.post_id = p.id) as comment_count,
    exists(select 1 from post_likes pl where pl.post_id = p.id and pl.user_id = $1) as liked,
    pr.user_id, pr.display_name, pr.handle, pr.avatar_hue, pr.avatar_url, pr.bio, pr.wallet_balance, pr.is_system
  from posts p
  join profiles pr on pr.user_id = p.author_id
`;
var bootstrapMe_createServerFn_handler = createServerRpc({
	id: "8141a8b5125180a319ccf0e5f4ebb194a95fa5b7e0f9abfca48c37f7632e6305",
	name: "bootstrapMe",
	filename: "src/lib/offx/server.ts"
}, (opts) => bootstrapMe.__executeServer(opts));
var bootstrapMe = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(bootstrapMe_createServerFn_handler, async ({ context }) => {
	return requireProfile(await getSql(), context.userId);
});
var listInbox_createServerFn_handler = createServerRpc({
	id: "425670bc9c63df5f6961bccd9d29094227b956a7cdca6e2aac1b9495f8489469",
	name: "listInbox",
	filename: "src/lib/offx/server.ts"
}, (opts) => listInbox.__executeServer(opts));
var listInbox = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(listInbox_createServerFn_handler, async ({ context }) => {
	const sql = await getSql();
	const me = await requireProfile(sql, context.userId);
	const rows = await sql`
      select c.id, c.participant_a, c.participant_b, c.last_message_at, c.last_message_preview,
        r.last_read_at
      from conversations c
      left join conversation_reads r
        on r.conversation_id = c.id and r.user_id = ${context.userId}
      where c.participant_a = ${context.userId} or c.participant_b = ${context.userId}
      order by c.last_message_at desc
    `;
	const out = [];
	for (const row of rows) {
		const other = await getProfile(sql, row.participant_a === context.userId ? row.participant_b : row.participant_a);
		if (!other) continue;
		const last = new Date(iso(row.last_message_at)).getTime();
		const read = row.last_read_at ? new Date(iso(row.last_read_at)).getTime() : 0;
		out.push({
			id: row.id,
			other,
			lastMessageAt: iso(row.last_message_at),
			lastMessagePreview: row.last_message_preview,
			unread: last > read
		});
	}
	return {
		me,
		conversations: out
	};
});
var listDirectory_createServerFn_handler = createServerRpc({
	id: "63a7e7816cc4d83f28e07fe73789bca35d9c48ed5e319626d67e3970d9bd7068",
	name: "listDirectory",
	filename: "src/lib/offx/server.ts"
}, (opts) => listDirectory.__executeServer(opts));
var listDirectory = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(listDirectory_createServerFn_handler, async ({ context }) => {
	const sql = await getSql();
	await requireProfile(sql, context.userId);
	return (await sql`
      select user_id, display_name, handle, avatar_hue, bio, wallet_balance, is_system
      from profiles
      where user_id <> ${context.userId} and is_system = false
      order by display_name asc
    `).map(mapProfile);
});
var openConversation_createServerFn_handler = createServerRpc({
	id: "b1f4b9a285b5486fa43af49fc787f02df4ce109d03ede1d2bdca1fe1e3bc6f5f",
	name: "openConversation",
	filename: "src/lib/offx/server.ts"
}, (opts) => openConversation.__executeServer(opts));
var openConversation = createServerFn({ method: "POST" }).validator((otherUserId) => {
	if (!otherUserId) throw new Error("Kein Kontakt gewählt.");
	return otherUserId;
}).middleware([authMiddleware]).handler(openConversation_createServerFn_handler, async ({ context, data: otherUserId }) => {
	if (otherUserId === context.userId) throw new Error("Das bist du selbst.");
	const sql = await getSql();
	await requireProfile(sql, context.userId);
	const other = await getProfile(sql, otherUserId);
	if (!other) throw new Error("Kontakt nicht gefunden.");
	if (other.isSystem) throw new Error("Dieser Kontakt ist nicht erreichbar.");
	return { conversationId: await getOrCreateConversation(sql, context.userId, otherUserId) };
});
var getThread_createServerFn_handler = createServerRpc({
	id: "1f254b0f7e42d9cc07fe322995327bad86af42fca366114d676cf9d593a74e9d",
	name: "getThread",
	filename: "src/lib/offx/server.ts"
}, (opts) => getThread.__executeServer(opts));
var getThread = createServerFn({ method: "POST" }).validator((conversationId) => conversationId).middleware([authMiddleware]).handler(getThread_createServerFn_handler, async ({ context, data: conversationId }) => {
	const sql = await getSql();
	const me = await requireProfile(sql, context.userId);
	const conv = await sql`select id, participant_a, participant_b from conversations where id = ${conversationId}`;
	if (!conv[0]) throw new Error("Unterhaltung nicht gefunden.");
	assertMember(context.userId, conv[0].participant_a, conv[0].participant_b);
	const other = await getProfile(sql, conv[0].participant_a === context.userId ? conv[0].participant_b : conv[0].participant_a);
	if (!other) throw new Error("Kontakt nicht gefunden.");
	await sql`
      insert into conversation_reads (conversation_id, user_id, last_read_at)
      values (${conversationId}, ${context.userId}, now())
      on conflict (conversation_id, user_id)
      do update set last_read_at = now()
    `;
	return {
		conversationId,
		other,
		me,
		messages: await loadMessages(sql, conversationId)
	};
});
var sendText_createServerFn_handler = createServerRpc({
	id: "94362d5b4b08ceec0ce829fd4d47dc9946b218184978c8c2161e21319cf9be0b",
	name: "sendText",
	filename: "src/lib/offx/server.ts"
}, (opts) => sendText.__executeServer(opts));
var sendText = createServerFn({ method: "POST" }).validator((input) => {
	const body = input.body.trim();
	if (!input.conversationId) throw new Error("Keine Unterhaltung.");
	if (!body) throw new Error("Nachricht ist leer.");
	if (body.length > 4e3) throw new Error("Nachricht ist zu lang.");
	return {
		conversationId: input.conversationId,
		body
	};
}).middleware([authMiddleware]).handler(sendText_createServerFn_handler, async ({ context, data }) => {
	const sql = await getSql();
	await requireProfile(sql, context.userId);
	const conv = await sql`
      select participant_a, participant_b from conversations where id = ${data.conversationId}
    `;
	if (!conv[0]) throw new Error("Unterhaltung nicht gefunden.");
	assertMember(context.userId, conv[0].participant_a, conv[0].participant_b);
	await insertMessage(sql, {
		conversationId: data.conversationId,
		senderId: context.userId,
		type: "text",
		body: data.body
	});
	return loadMessages(sql, data.conversationId);
});
var sendImage_createServerFn_handler = createServerRpc({
	id: "435580c3c7295132a125bb433cb4edbc9fcd60d5cf46374f9063a5b06e10d8a5",
	name: "sendImage",
	filename: "src/lib/offx/server.ts"
}, (opts) => sendImage.__executeServer(opts));
var sendImage = createServerFn({ method: "POST" }).validator((input) => {
	if (!input.conversationId) throw new Error("Keine Unterhaltung.");
	if (!input.imageUrl.startsWith("data:image/")) throw new Error("Ungültiges Bild.");
	if (input.imageUrl.length > 14e5) throw new Error("Bild ist zu groß.");
	return input;
}).middleware([authMiddleware]).handler(sendImage_createServerFn_handler, async ({ context, data }) => {
	const sql = await getSql();
	await requireProfile(sql, context.userId);
	const conv = await sql`
      select participant_a, participant_b from conversations where id = ${data.conversationId}
    `;
	if (!conv[0]) throw new Error("Unterhaltung nicht gefunden.");
	assertMember(context.userId, conv[0].participant_a, conv[0].participant_b);
	await insertMessage(sql, {
		conversationId: data.conversationId,
		senderId: context.userId,
		type: "image",
		imageUrl: data.imageUrl
	});
	return loadMessages(sql, data.conversationId);
});
var sendPayment_createServerFn_handler = createServerRpc({
	id: "35cba15065e544fabbe97fb7b1aaf8687e13225378448deebf2f7b7c00e16849",
	name: "sendPayment",
	filename: "src/lib/offx/server.ts"
}, (opts) => sendPayment.__executeServer(opts));
var sendPayment = createServerFn({ method: "POST" }).validator((input) => {
	if (!input.conversationId) throw new Error("Keine Unterhaltung.");
	if (input.kind !== "send" && input.kind !== "request") throw new Error("Ungültiger Typ.");
	const amount = parseAmount(input.amount);
	const note = (input.note ?? "").trim().slice(0, 80);
	return {
		conversationId: input.conversationId,
		amount,
		note,
		kind: input.kind
	};
}).middleware([authMiddleware]).handler(sendPayment_createServerFn_handler, async ({ context, data }) => {
	const sql = await getSql();
	await requireProfile(sql, context.userId);
	const conv = await sql`
      select participant_a, participant_b from conversations where id = ${data.conversationId}
    `;
	if (!conv[0]) throw new Error("Unterhaltung nicht gefunden.");
	assertMember(context.userId, conv[0].participant_a, conv[0].participant_b);
	const otherId = conv[0].participant_a === context.userId ? conv[0].participant_b : conv[0].participant_a;
	const other = await getProfile(sql, otherId);
	if (!other) throw new Error("Kontakt nicht gefunden.");
	if (other.isSystem) throw new Error("Dieser Kontakt ist nicht erreichbar.");
	const split = splitNox(data.amount);
	const txId = crypto.randomUUID();
	const status = "pending";
	if (data.kind === "send") await debit(sql, context.userId, split.gross);
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
		transactionId: txId
	});
	return loadMessages(sql, data.conversationId);
});
var resolvePayment_createServerFn_handler = createServerRpc({
	id: "c69efa90223da3f7d5587c40a507cfc37080dc463a078e908c36206ddcc4c551",
	name: "resolvePayment",
	filename: "src/lib/offx/server.ts"
}, (opts) => resolvePayment.__executeServer(opts));
var resolvePayment = createServerFn({ method: "POST" }).validator((input) => {
	if (!input.transactionId) throw new Error("Keine Transaktion.");
	if (input.action !== "accept" && input.action !== "decline") throw new Error("Ungültige Aktion.");
	return input;
}).middleware([authMiddleware]).handler(resolvePayment_createServerFn_handler, async ({ context, data }) => {
	const sql = await getSql();
	await requireProfile(sql, context.userId);
	const tx = (await sql`
      select id, conversation_id, sender_id, recipient_id, amount, fee, net, currency, note, kind, status, created_at, resolved_at, euro_paid
      from transactions where id = ${data.transactionId}
    `)[0];
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
		} else if (tx.recipient_id !== context.userId) throw new Error("Nur die angefragte Person kann ablehnen.");
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
var listFeed_createServerFn_handler = createServerRpc({
	id: "b1e11c6bfb4aa0c2a69e7bb419b727706c5136fa9588004a3e09971226f4dec5",
	name: "listFeed",
	filename: "src/lib/offx/server.ts"
}, (opts) => listFeed.__executeServer(opts));
var listFeed = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(listFeed_createServerFn_handler, async ({ context }) => {
	const sql = await getSql();
	await requireProfile(sql, context.userId);
	return (await sql.query(`${FEED_SQL} order by p.created_at desc limit 60`, [context.userId])).map(mapFeedRow);
});
var listUserPosts_createServerFn_handler = createServerRpc({
	id: "7034b765b81f57e62cf39755062b591973baa17bc03937828592e32861314114",
	name: "listUserPosts",
	filename: "src/lib/offx/server.ts"
}, (opts) => listUserPosts.__executeServer(opts));
var listUserPosts = createServerFn({ method: "POST" }).validator((userId) => userId).middleware([authMiddleware]).handler(listUserPosts_createServerFn_handler, async ({ context, data: userId }) => {
	const sql = await getSql();
	await requireProfile(sql, context.userId);
	const profile = await getProfile(sql, userId);
	if (!profile) throw new Error("Profil nicht gefunden.");
	return {
		profile,
		posts: (await sql.query(`${FEED_SQL} where p.author_id = $2 order by p.created_at desc limit 60`, [context.userId, userId])).map(mapFeedRow)
	};
});
var createPost_createServerFn_handler = createServerRpc({
	id: "d545c51daa16c99d7452fbd3a3afd40f481f681eed0ea8e89354d6728827fdff",
	name: "createPost",
	filename: "src/lib/offx/server.ts"
}, (opts) => createPost.__executeServer(opts));
var createPost = createServerFn({ method: "POST" }).validator((input) => {
	const caption = (input.caption ?? "").trim().slice(0, 500);
	if (input.mediaType !== "image" && input.mediaType !== "video") throw new Error("Ungültiger Medientyp.");
	const okImage = input.mediaUrl.startsWith("data:image/") || input.mediaUrl.startsWith("/feed/");
	const okVideo = input.mediaUrl.startsWith("data:video/") || input.mediaUrl.startsWith("/feed/");
	if (input.mediaType === "image" && !okImage) throw new Error("Ungültiges Bild.");
	if (input.mediaType === "video" && !okVideo) throw new Error("Ungültiges Video.");
	if (input.mediaUrl.length > 32e5) throw new Error("Datei ist zu groß.");
	return {
		caption,
		mediaType: input.mediaType,
		mediaUrl: input.mediaUrl,
		posterUrl: input.posterUrl ?? null
	};
}).middleware([authMiddleware]).handler(createPost_createServerFn_handler, async ({ context, data }) => {
	const sql = await getSql();
	await requireProfile(sql, context.userId);
	const id = crypto.randomUUID();
	await sql`
      insert into posts (id, author_id, caption, media_type, media_url, poster_url)
      values (${id}, ${context.userId}, ${data.caption}, ${data.mediaType}, ${data.mediaUrl}, ${data.posterUrl})
    `;
	return { id };
});
var toggleLike_createServerFn_handler = createServerRpc({
	id: "4016b6b921525f91812b650c107282d443a7e874f9d71589efc792fa922961af",
	name: "toggleLike",
	filename: "src/lib/offx/server.ts"
}, (opts) => toggleLike.__executeServer(opts));
var toggleLike = createServerFn({ method: "POST" }).validator((postId) => postId).middleware([authMiddleware]).handler(toggleLike_createServerFn_handler, async ({ context, data: postId }) => {
	const sql = await getSql();
	await requireProfile(sql, context.userId);
	if ((await sql`
      select post_id from post_likes where post_id = ${postId} and user_id = ${context.userId}
    `)[0]) {
		await sql`delete from post_likes where post_id = ${postId} and user_id = ${context.userId}`;
		return { liked: false };
	}
	await sql`
      insert into post_likes (post_id, user_id) values (${postId}, ${context.userId})
      on conflict do nothing
    `;
	return { liked: true };
});
var listComments_createServerFn_handler = createServerRpc({
	id: "d877305f8be9c5161968d2308e9eb62e437fea95b21a21082a61c5b81b294ad1",
	name: "listComments",
	filename: "src/lib/offx/server.ts"
}, (opts) => listComments.__executeServer(opts));
var listComments = createServerFn({ method: "POST" }).validator((postId) => postId).middleware([authMiddleware]).handler(listComments_createServerFn_handler, async ({ context, data: postId }) => {
	const sql = await getSql();
	await requireProfile(sql, context.userId);
	return (await sql`
      select c.id, c.post_id, c.body, c.created_at,
        pr.user_id, pr.display_name, pr.handle, pr.avatar_hue, pr.avatar_url, pr.bio, pr.wallet_balance, pr.is_system
      from post_comments c
      join profiles pr on pr.user_id = c.author_id
      where c.post_id = ${postId}
      order by c.created_at asc
    `).map((r) => ({
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
			is_system: r.is_system
		})
	}));
});
var addComment_createServerFn_handler = createServerRpc({
	id: "6154d08660e747c0427f2f772900fbab8f367b15acdf016c53a33c025790b0bb",
	name: "addComment",
	filename: "src/lib/offx/server.ts"
}, (opts) => addComment.__executeServer(opts));
var addComment = createServerFn({ method: "POST" }).validator((input) => {
	const body = input.body.trim();
	if (!input.postId) throw new Error("Kein Beitrag.");
	if (!body) throw new Error("Kommentar ist leer.");
	if (body.length > 500) throw new Error("Kommentar ist zu lang.");
	return {
		postId: input.postId,
		body
	};
}).middleware([authMiddleware]).handler(addComment_createServerFn_handler, async ({ context, data }) => {
	const sql = await getSql();
	await requireProfile(sql, context.userId);
	const id = crypto.randomUUID();
	await sql`
      insert into post_comments (id, post_id, author_id, body)
      values (${id}, ${data.postId}, ${context.userId}, ${data.body})
    `;
	return { id };
});
var updateProfile_createServerFn_handler = createServerRpc({
	id: "2e8fe96d9add505de801399aab805ccca777acee03da966ffa799f53b3ae99a3",
	name: "updateProfile",
	filename: "src/lib/offx/server.ts"
}, (opts) => updateProfile.__executeServer(opts));
var updateProfile = createServerFn({ method: "POST" }).validator((input) => {
	const displayName = input.displayName.trim().slice(0, 40);
	if (displayName.length < 2) throw new Error("Nickname ist zu kurz.");
	const handle = input.handle.trim().toLowerCase().replace(/^@/, "").replace(/[^a-z0-9_]/g, "").slice(0, 20);
	if (handle.length < 2) throw new Error("Username: mind. 2 Zeichen, nur a–z, 0–9, _.");
	const avatarUrl = input.avatarUrl === void 0 ? void 0 : input.avatarUrl;
	if (avatarUrl && (typeof avatarUrl !== "string" || avatarUrl.length > 4e5)) throw new Error("Profilbild ist zu groß.");
	if (avatarUrl && !avatarUrl.startsWith("data:image/")) throw new Error("Profilbild ungültig.");
	return {
		displayName,
		handle,
		bio: input.bio.trim().slice(0, 140),
		avatarUrl
	};
}).middleware([authMiddleware]).handler(updateProfile_createServerFn_handler, async ({ context, data }) => {
	const sql = await getSql();
	await requireProfile(sql, context.userId);
	if ((await sql`
      select user_id from profiles
      where handle = ${data.handle} and user_id <> ${context.userId}
      limit 1
    `)[0]) throw new Error(`@${data.handle} ist schon vergeben.`);
	if (data.avatarUrl === void 0) await sql`
        update profiles
        set display_name = ${data.displayName}, handle = ${data.handle}, bio = ${data.bio}, updated_at = now()
        where user_id = ${context.userId}
      `;
	else await sql`
        update profiles
        set display_name = ${data.displayName},
            handle = ${data.handle},
            bio = ${data.bio},
            avatar_url = ${data.avatarUrl},
            updated_at = now()
        where user_id = ${context.userId}
      `;
	return requireProfile(sql, context.userId);
});
var getWallet_createServerFn_handler = createServerRpc({
	id: "aab5e868c32332a49e5b6e3b1614b2de68423ec57c91c1df833f58caae63ecd7",
	name: "getWallet",
	filename: "src/lib/offx/server.ts"
}, (opts) => getWallet.__executeServer(opts));
var getWallet = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(getWallet_createServerFn_handler, async ({ context }) => {
	return loadWallet(await getSql(), context.userId);
});
var topUp_createServerFn_handler = createServerRpc({
	id: "b1b07698e49e19ccbc0d235b3515d2e2fe0149468887cb250caa54a2f2e3bc35",
	name: "topUp",
	filename: "src/lib/offx/server.ts"
}, (opts) => topUp.__executeServer(opts));
var topUp = createServerFn({ method: "POST" }).validator((input) => {
	const pack = packById(input.packId);
	if (!pack) throw new Error("Unbekanntes Pack.");
	const holder = String(input.holder ?? "").trim();
	if (holder.length < 3) throw new Error("Name auf der Karte fehlt.");
	const last4 = String(input.last4 ?? "").replace(/\D/g, "");
	if (!/^\d{4}$/.test(last4)) throw new Error("Zahlung unvollständig.");
	const expMonth = Number(input.expMonth);
	const expYear = Number(input.expYear);
	const now = /* @__PURE__ */ new Date();
	if (!Number.isInteger(expMonth) || !Number.isInteger(expYear) || expMonth < 1 || expMonth > 12 || expYear * 12 + (expMonth - 1) < now.getFullYear() * 12 + now.getMonth()) throw new Error("Karte ist abgelaufen.");
	const brand = String(input.brand ?? "card").slice(0, 16);
	return {
		pack,
		holder: holder.slice(0, 48),
		last4,
		brand,
		expMonth,
		expYear
	};
}).middleware([authMiddleware]).handler(topUp_createServerFn_handler, async ({ context, data }) => {
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
var requestEmailCode_createServerFn_handler = createServerRpc({
	id: "a6f288ad60cd70f5c9ef2eccfdd5facb4280c5341a888ebcd09fac18c30a1f64",
	name: "requestEmailCode",
	filename: "src/lib/offx/server.ts"
}, (opts) => requestEmailCode.__executeServer(opts));
var requestEmailCode = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(requestEmailCode_createServerFn_handler, async ({ context }) => {
	const sql = await getSql();
	if ((await requireProfile(sql, context.userId)).emailVerified) return {
		verified: true,
		email: null,
		previewCode: null
	};
	const ident = await authIdentity(sql, context.userId);
	const recent = await sql`
      select created_at from email_codes where user_id = ${context.userId}
    `;
	if (recent[0]) {
		if (Date.now() - new Date(iso(recent[0].created_at)).getTime() < 2e4) throw new Error("Bitte kurz warten, dann neu anfordern.");
	}
	const code = String(randomInt(1e5, 1e6));
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
	return {
		verified: false,
		email: ident.email,
		previewCode: code
	};
});
var verifyEmailCode_createServerFn_handler = createServerRpc({
	id: "a55fc4265ea8c8e2914bc147e5e1c45c6ffcc26b718a8da9d4beed38f45973b5",
	name: "verifyEmailCode",
	filename: "src/lib/offx/server.ts"
}, (opts) => verifyEmailCode.__executeServer(opts));
var verifyEmailCode = createServerFn({ method: "POST" }).validator((code) => {
	const clean = code.replace(/\s/g, "");
	if (!/^\d{6}$/.test(clean)) throw new Error("Sechs Ziffern, bitte.");
	return clean;
}).middleware([authMiddleware]).handler(verifyEmailCode_createServerFn_handler, async ({ context, data: code }) => {
	const sql = await getSql();
	await requireProfile(sql, context.userId);
	const row = (await sql`
      select code_hash, expires_at, attempts from email_codes where user_id = ${context.userId}
    `)[0];
	if (!row) throw new Error("Kein Code offen. Fordere einen neuen an.");
	if (new Date(iso(row.expires_at)).getTime() < Date.now()) throw new Error("Code ist abgelaufen.");
	if (toInt(row.attempts) >= 8) throw new Error("Zu viele Versuche. Fordere einen neuen Code an.");
	if (hashEmailCode(context.userId, code) !== row.code_hash) {
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
var cashOut_createServerFn_handler = createServerRpc({
	id: "c89f3da9bd3dab5786899b83b4654e6c7104438b4561709af6f2bcca8d96e8ba",
	name: "cashOut",
	filename: "src/lib/offx/server.ts"
}, (opts) => cashOut.__executeServer(opts));
var cashOut = createServerFn({ method: "POST" }).validator((amount) => parseAmount(amount)).middleware([authMiddleware]).handler(cashOut_createServerFn_handler, async ({ context, data: amount }) => {
	const sql = await getSql();
	await requireProfile(sql, context.userId);
	await debit(sql, context.userId, amount);
	await sql`
      insert into transactions (id, sender_id, recipient_id, amount, note, kind, status, resolved_at)
      values (
        ${crypto.randomUUID()}, ${context.userId}, ${context.userId}, ${amount}::numeric,
        ${"Auszahlung auf Bank •• 4281"}, ${"cashout"}, ${"completed"}, now()
      )
    `;
	return loadWallet(sql, context.userId);
});
//#endregion
export { addComment_createServerFn_handler, bootstrapMe_createServerFn_handler, cashOut_createServerFn_handler, createPost_createServerFn_handler, getThread_createServerFn_handler, getWallet_createServerFn_handler, listComments_createServerFn_handler, listDirectory_createServerFn_handler, listFeed_createServerFn_handler, listInbox_createServerFn_handler, listUserPosts_createServerFn_handler, openConversation_createServerFn_handler, requestEmailCode_createServerFn_handler, resolvePayment_createServerFn_handler, sendImage_createServerFn_handler, sendPayment_createServerFn_handler, sendText_createServerFn_handler, toggleLike_createServerFn_handler, topUp_createServerFn_handler, updateProfile_createServerFn_handler, verifyEmailCode_createServerFn_handler };
