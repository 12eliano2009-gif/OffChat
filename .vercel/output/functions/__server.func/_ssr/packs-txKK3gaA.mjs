import { n as createMiddleware } from "./ssr.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/packs-txKK3gaA.js
/**
* Auth middleware for server functions — the standard way to get the caller's
* verified user id. When deployed the session cookie is same-origin and rides
* along automatically. In the live preview the client also forwards the bearer
* token (partitioned cookies) via the `.client` hook below — call sites do not
* thread it themselves.
*
*   import { createServerFn } from "@tanstack/react-start";
*   import { getSql } from "@/lib/db";
*   import { authMiddleware } from "@/lib/auth/middleware";
*
*   export const listTodos = createServerFn({ method: "GET" })
*     .middleware([authMiddleware])
*     .handler(async ({ context }) => {
*       const sql = await getSql();
*       return sql`select * from todos where user_id = ${context.userId}`;
*     });
*
* Signed out with auth on (live preview included) -> throws `UnauthorizedError`
* (see `verify.server.ts`). With auth disabled (`VITE_AUTH_ENABLED=false`, the
* shipped default) it resolves the shared dev user — but throws instead when a
* `DATABASE_URL` is also set, so an app without sign-in must not use this at
* all. On the auth-on path, use it on every server function that touches
* per-user data and scope every query by `context.userId`.
*/
var authMiddleware = createMiddleware({ type: "function" }).client(async ({ next }) => {
	const { getBearerToken } = await import("./client-B40BzJxt.mjs").then((n) => n.n).then((n) => n.n);
	return next({ sendContext: { bearerToken: getBearerToken() ?? void 0 } });
}).server(async ({ next, context }) => {
	const { assertSameSiteRequest } = await import("./isolation.server-CGNg1r0B.mjs");
	const { requireUserId } = await import("./verify.server-CSEj-5ST.mjs");
	assertSameSiteRequest();
	return next({ context: { userId: await requireUserId(context.bearerToken) } });
});
var NOX_CUT = .3;
var TREASURY_ID = "offx-treasury";
function toMoney(value) {
	const n = typeof value === "number" ? value : Number(value);
	if (!Number.isFinite(n)) return "0.00";
	return n.toFixed(2);
}
function splitNox(amount) {
	const n = typeof amount === "number" ? amount : Number(amount);
	const cents = Math.round((Number.isFinite(n) ? n : 0) * 100);
	const feeCents = Math.round(cents * NOX_CUT);
	const netCents = Math.max(0, cents - feeCents);
	return {
		gross: (cents / 100).toFixed(2),
		fee: (feeCents / 100).toFixed(2),
		net: (netCents / 100).toFixed(2)
	};
}
function formatNox(amount) {
	const n = typeof amount === "number" ? amount : Number(amount);
	const safe = Number.isFinite(n) ? n : 0;
	return `${new Intl.NumberFormat("de-DE", {
		minimumFractionDigits: Number.isInteger(safe) ? 0 : 2,
		maximumFractionDigits: 2
	}).format(safe)} NOX`;
}
function iso(value) {
	if (value instanceof Date) return value.toISOString();
	if (typeof value === "string" && value) return value;
	return (/* @__PURE__ */ new Date()).toISOString();
}
function toInt(value) {
	const n = typeof value === "number" ? value : Number(value);
	return Number.isFinite(n) ? Math.trunc(n) : 0;
}
function toBool(value) {
	return value === true || value === "t" || value === "true" || value === 1;
}
function relTime(isoDate) {
	const then = new Date(isoDate).getTime();
	if (!Number.isFinite(then)) return "";
	const min = Math.max(0, Math.floor((Date.now() - then) / 6e4));
	if (min < 1) return "jetzt";
	if (min < 60) return `${min} Min.`;
	const hours = Math.floor(min / 60);
	if (hours < 24) return `${hours} Std.`;
	const days = Math.floor(hours / 24);
	if (days < 7) return `${days} T.`;
	return new Date(isoDate).toLocaleDateString("de-DE", {
		day: "numeric",
		month: "short"
	});
}
function parseAmount(raw) {
	const n = Number(String(raw).replace(/\s/g, "").replace(",", "."));
	if (!Number.isFinite(n) || n < 1 || n > 1e4) throw new Error("Betrag muss zwischen 1 und 10.000 NOX liegen.");
	return n.toFixed(2);
}
function initials(name) {
	const parts = name.trim().split(/\s+/).filter(Boolean);
	if (parts.length === 0) return "O";
	if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
	return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
function hueStyle(hue) {
	const h = (hue % 360 + 360) % 360;
	return {
		background: `hsl(${h} 18% 22%)`,
		color: `hsl(${h} 32% 86%)`
	};
}
var NOX_PACKS = [
	{
		id: "10",
		nox: 10,
		euro: .99,
		savePct: 0
	},
	{
		id: "25",
		nox: 25,
		euro: 2.19,
		savePct: 12
	},
	{
		id: "50",
		nox: 50,
		euro: 3.99,
		savePct: 19
	},
	{
		id: "100",
		nox: 100,
		euro: 6.99,
		savePct: 29
	},
	{
		id: "250",
		nox: 250,
		euro: 14.99,
		savePct: 39
	}
];
function packById(id) {
	return NOX_PACKS.find((p) => p.id === id) ?? null;
}
function formatEuro(amount) {
	const n = typeof amount === "number" ? amount : Number(amount);
	const safe = Number.isFinite(n) ? n : 0;
	return new Intl.NumberFormat("de-DE", {
		style: "currency",
		currency: "EUR"
	}).format(safe);
}
//#endregion
export { formatNox as a, iso as c, relTime as d, splitNox as f, toMoney as h, formatEuro as i, packById as l, toInt as m, TREASURY_ID as n, hueStyle as o, toBool as p, authMiddleware as r, initials as s, NOX_PACKS as t, parseAmount as u };
