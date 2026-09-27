import { getSql, type Sql } from "@/lib/db";
import { packById } from "./packs";
import { paypalCheckoutFields, PAYPAL_IPN_VERIFY, PAYPAL_RECEIVER } from "./paypal";
import { TREASURY_ID } from "./format";

export type PaypalOrder = {
  id: string;
  packId: string;
  nox: string;
  euro: string;
  status: "pending" | "completed" | "canceled";
};

function money(n: number | string): string {
  return Number(n).toFixed(2);
}

async function ensureTreasury(sql: Sql) {
  await sql`
    insert into profiles (user_id, display_name, handle, avatar_hue, bio, wallet_balance, is_system)
    values (${TREASURY_ID}, ${"Offchat"}, ${"_nox"}, ${0}, ${"NOX treasury."}, ${"0"}::numeric, ${true})
    on conflict (user_id) do nothing
  `;
}

export function checkoutOrigin(raw: string): string {
  const u = new URL(raw);
  if (u.protocol !== "https:" && u.protocol !== "http:") {
    throw new Error("Ungültige Rückkehr-Adresse.");
  }
  if (u.username || u.password) throw new Error("Ungültige Rückkehr-Adresse.");
  return u.origin;
}

export async function createPaypalOrder(
  userId: string,
  packId: string,
  origin: string,
): Promise<{ orderId: string; action: string; fields: Record<string, string> }> {
  const pack = packById(packId);
  if (!pack) throw new Error("Unbekanntes Pack.");
  const safeOrigin = checkoutOrigin(origin);
  const sql = await getSql();
  await ensureTreasury(sql);
  const id = crypto.randomUUID();
  await sql`
    insert into paypal_orders (id, user_id, pack_id, nox, euro, status)
    values (
      ${id},
      ${userId},
      ${pack.id},
      ${money(pack.nox)}::numeric,
      ${money(pack.euro)}::numeric,
      ${"pending"}
    )
  `;
  return {
    orderId: id,
    action: "https://www.paypal.com/cgi-bin/webscr",
    fields: paypalCheckoutFields({
      origin: safeOrigin,
      orderId: id,
      packId: pack.id,
      nox: pack.nox,
      euro: pack.euro,
    }),
  };
}

export async function readPaypalOrder(userId: string, orderId: string): Promise<PaypalOrder | null> {
  const sql = await getSql();
  const rows = await sql<{
    id: string;
    pack_id: string;
    nox: unknown;
    euro: unknown;
    status: PaypalOrder["status"];
  }>`
    select id, pack_id, nox, euro, status
    from paypal_orders
    where id = ${orderId} and user_id = ${userId}
  `;
  const row = rows[0];
  if (!row) return null;
  return {
    id: row.id,
    packId: row.pack_id,
    nox: money(String(row.nox)),
    euro: money(String(row.euro)),
    status: row.status,
  };
}

async function creditOrder(sql: Sql, orderId: string, txn: string): Promise<boolean> {
  const rows = await sql<{
    id: string;
    user_id: string;
    pack_id: string;
    nox: unknown;
    euro: unknown;
    status: string;
  }>`
    select id, user_id, pack_id, nox, euro, status
    from paypal_orders
    where id = ${orderId}
  `;
  const order = rows[0];
  if (!order) return false;
  if (order.status === "completed") return true;
  if (order.status !== "pending") return false;

  const taken = await sql<{ id: string }>`
    select id from paypal_orders where paypal_txn = ${txn} and id <> ${orderId}
  `;
  if (taken[0]) return false;

  const claimed = await sql<{ id: string; user_id: string; nox: unknown; euro: unknown }>`
    update paypal_orders
    set status = ${"completed"}, paypal_txn = ${txn}, completed_at = now()
    where id = ${orderId} and status = ${"pending"}
    returning id, user_id, nox, euro
  `;
  const paid = claimed[0];
  if (!paid) return true;

  const nox = money(String(paid.nox));
  const euro = money(String(paid.euro));
  const note = `${Number(nox)} NOX · PayPal → ${PAYPAL_RECEIVER}`;
  const txId = crypto.randomUUID();
  await sql`
    update profiles
    set wallet_balance = wallet_balance + ${nox}::numeric, updated_at = now()
    where user_id = ${paid.user_id}
  `;
  await sql`
    insert into transactions (
      id, sender_id, recipient_id, amount, fee, net, currency, note, kind, status, resolved_at, euro_paid
    )
    values (
      ${txId}, ${paid.user_id}, ${paid.user_id}, ${nox}::numeric,
      ${"0"}::numeric, ${nox}::numeric, ${"NOX"}, ${note},
      ${"topup"}, ${"completed"}, now(), ${euro}::numeric
    )
  `;
  return true;
}

function receiverOk(params: URLSearchParams): boolean {
  const want = PAYPAL_RECEIVER.toLowerCase();
  const emails = [params.get("receiver_email"), params.get("business")]
    .filter(Boolean)
    .map((v) => String(v).trim().toLowerCase());
  return emails.includes(want);
}

export async function verifyAndFulfillIpn(body: string): Promise<{ ok: boolean }> {
  const params = new URLSearchParams(body);
  const verify = new URLSearchParams(body);
  verify.append("cmd", "_notify-validate");
  const res = await fetch(PAYPAL_IPN_VERIFY, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      "user-agent": "OFFCHAT-IPN",
    },
    body: verify.toString(),
  });
  const verdict = (await res.text()).trim();
  if (verdict !== "VERIFIED") return { ok: false };

  const status = (params.get("payment_status") ?? "").toLowerCase();
  if (status !== "completed") return { ok: true };
  if (!receiverOk(params)) return { ok: false };
  if ((params.get("mc_currency") ?? "").toUpperCase() !== "EUR") return { ok: false };

  const orderId = (params.get("custom") || params.get("invoice") || "").trim();
  const txn = (params.get("txn_id") || "").trim();
  if (!orderId || !txn) return { ok: false };

  const sql = await getSql();
  const rows = await sql<{ euro: unknown }>`
    select euro from paypal_orders where id = ${orderId}
  `;
  const expected = Number(rows[0]?.euro);
  const paid = Number(params.get("mc_gross"));
  if (!rows[0] || !Number.isFinite(paid) || Math.abs(paid - expected) > 0.009) {
    return { ok: false };
  }
  await creditOrder(sql, orderId, txn);
  return { ok: true };
}

export async function handlePaypalIpn(request: Request): Promise<Response> {
  if (request.method === "GET") return new Response("ok", { status: 200 });
  const body = await request.text();
  try {
    await verifyAndFulfillIpn(body);
  } catch (err) {
    console.error("[paypal-ipn]", err);
    return new Response("error", { status: 500 });
  }
  return new Response("ok", { status: 200 });
}
