import { o as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { C as require_jsx_runtime, x as useNavigate, y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { d as relTime } from "./packs-txKK3gaA.mjs";
import { h as Search, l as SquarePen } from "../_libs/lucide-react.mjs";
import { d as cn } from "./router-By-l8WBZ.mjs";
import { y as useLan } from "./signed-in-B-7bejH-.mjs";
import { t as UserAvatar } from "./avatar-COyG8STG.mjs";
import { t as Input } from "./input-CpxBPLku.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/inbox-CgGHJwmn.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function Inbox({ activeId }) {
	const lan = useLan();
	const [composer, setComposer] = (0, import_react.useState)(false);
	const rows = lan.inbox;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex h-full min-h-0 flex-col",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between px-4 py-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-display text-xl tracking-[0.12em]",
					children: "Chats"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "grid size-11 place-items-center text-fg",
					onClick: () => setComposer(true),
					"aria-label": "Neuer Chat",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SquarePen, { className: "size-5" })
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
				className: "flex-1 overflow-y-auto",
				children: [rows.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "px-6 py-16 text-center",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm font-medium",
							children: "Chats in diesem Netz"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-sm leading-relaxed text-muted",
							children: "Nur Menschen im selben WLAN — öffentlich oder privat. Tippe auf den Stift. Wer Offchat hier geöffnet hat, steht in der Liste."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "mt-4 text-sm font-medium text-fg underline-offset-4 hover:underline",
							onClick: () => setComposer(true),
							children: "Menschen in der Nähe"
						})
					]
				}), rows.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/c/$conversationId",
					params: { conversationId: row.id },
					className: cn("flex items-center gap-3 px-4 py-3 transition-colors duration-150 hover:bg-elevated", activeId === row.id && "bg-elevated"),
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserAvatar, {
							name: row.other.displayName,
							hue: row.other.avatarHue,
							src: row.other.avatarUrl,
							system: row.other.isSystem
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0 flex-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-baseline justify-between gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: cn("truncate text-sm", row.unread ? "font-semibold" : "font-medium"),
									children: row.other.displayName
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "shrink-0 text-[11px] text-faint",
									children: relTime(row.lastMessageAt)
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: cn("truncate text-sm", row.unread ? "text-fg" : "text-muted"),
								children: row.lastMessagePreview
							})]
						}),
						row.unread && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "size-2 shrink-0 rounded-full bg-fg" })
					]
				}) }, row.id))]
			}),
			composer && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NewChat, { onClose: () => setComposer(false) })
		]
	});
}
function NewChat({ onClose }) {
	const lan = useLan();
	const navigate = useNavigate();
	const [q, setQ] = (0, import_react.useState)("");
	const people = lan.people;
	const filtered = people.filter((p) => {
		return `${p.displayName} ${p.handle}`.toLowerCase().includes(q.trim().toLowerCase());
	});
	function start(userId) {
		const id = lan.openConversation(userId);
		onClose();
		navigate({
			to: "/c/$conversationId",
			params: { conversationId: id }
		});
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-40 flex items-end justify-center bg-bg/70 p-3 lg:items-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex max-h-[80dvh] w-full max-w-md flex-col rounded-2xl bg-surface p-4 shadow-[var(--shadow-lift)]",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mb-3 flex items-center justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm font-medium",
						children: "In diesem Netz"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "text-sm text-muted",
						onClick: onClose,
						children: "Schließen"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative mb-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: q,
						onChange: (e) => setQ(e.target.value),
						placeholder: "Suchen",
						className: "pl-9"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
					className: "flex-1 overflow-y-auto",
					children: [filtered.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
						className: "px-2 py-8 text-center text-sm text-muted",
						children: people.length === 0 ? "Niemand sonst in diesem WLAN. Offchat auf einem zweiten Gerät im selben Netz öffnen." : "Kein Treffer."
					}), filtered.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => start(p.userId),
						className: "flex w-full items-center gap-3 rounded-lg px-1 py-2 text-left hover:bg-elevated",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserAvatar, {
							name: p.displayName,
							hue: p.avatarHue,
							src: p.avatarUrl,
							system: p.isSystem,
							size: "sm"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "block text-sm font-medium",
							children: p.displayName
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "text-xs text-muted",
							children: ["@", p.handle]
						})] })]
					}) }, p.userId))]
				})
			]
		})
	});
}
//#endregion
export { Inbox as t };
