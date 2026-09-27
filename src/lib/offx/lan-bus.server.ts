/**
 * Room event bus: chat, likes, posts, presence. Complements WebRTC so messages
 * still arrive when a café Wi-Fi blocks device-to-device (AP isolation).
 */
import { z } from "zod";
import { getSql, type Sql } from "@/lib/db";

const ID = z.string().regex(/^[a-zA-Z0-9_-]{1,64}$/);
const eventSchema = z.object({
  room: ID,
  from: ID,
  payload: z.unknown().refine((v) => v !== undefined && JSON.stringify(v).length <= 1_200_000, {
    message: "payload too large",
  }),
});

const EVENT_TTL_SECONDS = 6 * 60 * 60;

const globalRef = globalThis as typeof globalThis & {
  __lanBusSchemaPromise__?: Promise<void>;
};

function ensureSchema(sql: Sql): Promise<void> {
  globalRef.__lanBusSchemaPromise__ ??= (async () => {
    await sql.query(
      `CREATE TABLE IF NOT EXISTS lan_events (
         id BIGSERIAL PRIMARY KEY,
         room TEXT NOT NULL,
         from_peer TEXT NOT NULL,
         payload JSONB NOT NULL,
         created_at TIMESTAMPTZ NOT NULL DEFAULT now()
       )`,
    );
    await sql.query(
      `CREATE INDEX IF NOT EXISTS lan_events_room_id ON lan_events (room, id)`,
    );
  })().catch((err) => {
    globalRef.__lanBusSchemaPromise__ = undefined;
    throw err;
  });
  return globalRef.__lanBusSchemaPromise__;
}

async function prune(sql: Sql) {
  await sql.query(`DELETE FROM lan_events WHERE created_at < now() - make_interval(secs => $1)`, [
    EVENT_TTL_SECONDS,
  ]);
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}

async function handleGet(url: URL): Promise<Response> {
  const parsed = z
    .object({
      room: ID,
      peer: ID,
      since: z.coerce.number().int().min(0).default(0),
    })
    .safeParse({
      room: url.searchParams.get("room"),
      peer: url.searchParams.get("peer"),
      since: url.searchParams.get("since") ?? 0,
    });
  if (!parsed.success) return json({ error: "invalid query" }, 400);
  const { room, peer, since } = parsed.data;
  const sql = await getSql();
  await ensureSchema(sql);
  if (since === 0 || Math.random() < 0.05) await prune(sql);

  const rows =
    since === 0
      ? await sql.query<{ id: number; from_peer: string; payload: unknown }>(
          `SELECT id, from_peer, payload FROM (
             SELECT id, from_peer, payload FROM lan_events
             WHERE room = $1 AND from_peer <> $2
             ORDER BY id DESC LIMIT 200
           ) q ORDER BY id ASC`,
          [room, peer],
        )
      : await sql.query<{ id: number; from_peer: string; payload: unknown }>(
          `SELECT id, from_peer, payload FROM lan_events
           WHERE room = $1 AND from_peer <> $2 AND id > $3
           ORDER BY id ASC LIMIT 200`,
          [room, peer, since],
        );

  return json({
    events: rows.map((r) => ({ id: r.id, from: r.from_peer, payload: r.payload })),
  });
}

async function handlePost(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "invalid JSON" }, 400);
  }
  const parsed = eventSchema.safeParse(body);
  if (!parsed.success) return json({ error: "invalid request" }, 400);
  const sql = await getSql();
  await ensureSchema(sql);
  await sql.query(`INSERT INTO lan_events (room, from_peer, payload) VALUES ($1, $2, $3)`, [
    parsed.data.room,
    parsed.data.from,
    JSON.stringify(parsed.data.payload),
  ]);
  return json({ ok: true });
}

export async function handleLanBus(request: Request): Promise<Response> {
  try {
    if (request.method === "GET") return await handleGet(new URL(request.url));
    if (request.method === "POST") return await handlePost(request);
    return json({ error: "method not allowed" }, 405);
  } catch (error) {
    console.error("[lan-bus]", error);
    return json({ error: "lan bus failed" }, 500);
  }
}
