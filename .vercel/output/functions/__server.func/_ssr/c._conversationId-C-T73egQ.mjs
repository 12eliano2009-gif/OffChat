import { o as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { C as require_jsx_runtime, y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as formatNox, f as splitNox } from "./packs-txKK3gaA.mjs";
import { E as ChevronLeft, m as Send, x as ImagePlus } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { d as cn, r as Route$2, s as useT, u as Button } from "./router-By-l8WBZ.mjs";
import { n as OffxMark } from "./logo-puPl-3SD.mjs";
import { t as Skeleton } from "./skeleton-DPoB2_JI.mjs";
import { n as RequireSignIn, t as AppFrame, y as useLan } from "./signed-in-B-7bejH-.mjs";
import { t as UserAvatar } from "./avatar-COyG8STG.mjs";
import { t as Inbox } from "./inbox-CgGHJwmn.mjs";
import { n as fileToMedia } from "./media-Da3cWhLi.mjs";
import { n as insertEmoji, t as EmojiPicker } from "./emoji-picker-DM86Gaf2.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/c._conversationId-C-T73egQ.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function statusTone(status) {
	if (status === "completed") return "success";
	if (status === "pending") return "warn";
	if (status === "declined") return "danger";
	return "muted";
}
function statusLabel(status) {
	if (status === "completed") return "Abgeschlossen";
	if (status === "pending") return "Offen";
	return "Abgelehnt";
}
function paymentTitle(p, meId, otherName) {
	const mine = p.senderId === meId;
	if (p.kind === "request") {
		if (p.status === "completed") return mine ? `${otherName} hat gezahlt` : `Du hast gezahlt`;
		if (p.status === "declined") return "Anfrage abgelehnt";
		return mine ? `Du forderst ${formatNox(p.amount)}` : `${otherName} fordert ${formatNox(p.amount)}`;
	}
	if (p.status === "completed") return mine ? `Du hast ${formatNox(p.amount)} gesendet` : `${otherName} hat ${formatNox(p.amount)} gesendet`;
	if (p.status === "declined") return "Zahlung abgelehnt";
	return mine ? `Du sendest ${formatNox(p.amount)}` : `${otherName} sendet dir ${formatNox(p.amount)}`;
}
function MessageBubble({ message, mine, other, meId, stacked, onResolve }) {
	if (message.type === "payment" && message.payment) {
		const p = message.payment;
		const canAct = p.status === "pending" && p.recipientId === meId && (p.kind === "send" || p.kind === "request");
		const incomingNet = p.kind === "send" && p.recipientId === meId || p.kind === "request" && p.senderId === meId;
		return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: cn("flex w-full", mine ? "justify-end" : "justify-start"),
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: cn("w-[min(100%,280px)] rounded-2xl bg-elevated p-4 shadow-[var(--shadow-border)]", mine ? "rounded-br-md" : "rounded-bl-md", stacked && "mt-1"),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[11px] font-medium uppercase tracking-[0.16em] text-muted",
						children: "NOX"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 font-display text-3xl tracking-wide tabular-nums text-fg",
						children: formatNox(p.amount)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-sm text-muted",
						children: paymentTitle(p, meId, other.displayName)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-xs leading-relaxed text-muted",
						children: incomingNet ? `${formatNox(p.net)} kommen an. ${formatNox(p.fee)} gehen an Offchat.` : `${formatNox(p.net)} an ${other.displayName}. ${formatNox(p.fee)} an Offchat.`
					}),
					p.note && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-sm text-fg/80",
						children: p.note
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-3",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusChip, { status: p.status })
					}),
					canAct && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 grid grid-cols-2 gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "sm",
							className: "h-10 rounded-md",
							onClick: () => onResolve(p.id, "accept"),
							children: p.kind === "request" ? "Zahlen" : "Annehmen"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "sm",
							variant: "secondary",
							className: "h-10 rounded-md",
							onClick: () => onResolve(p.id, "decline"),
							children: "Ablehnen"
						})]
					})
				]
			})
		});
	}
	if (message.type === "image" && message.imageUrl) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: cn("flex w-full", mine ? "justify-end" : "justify-start"),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
			src: message.imageUrl,
			alt: "",
			className: cn("max-h-72 max-w-[72%] rounded-2xl object-cover", mine ? "rounded-br-md" : "rounded-bl-md", stacked && "mt-1")
		})
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: cn("flex w-full", mine ? "justify-end" : "justify-start"),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: cn("max-w-[78%] rounded-2xl px-3.5 py-2 text-[15px] leading-snug", mine ? "rounded-br-md bg-bubble text-bubble-fg" : "rounded-bl-md bg-incoming text-incoming-fg", stacked && "mt-1"),
			children: message.body
		})
	});
}
function StatusChip({ status }) {
	const tone = statusTone(status);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: cn("inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium", tone === "success" ? "bg-success/15 text-success" : tone === "warn" ? "bg-warn/15 text-warn" : tone === "danger" ? "bg-destructive/15 text-destructive" : "bg-elevated text-muted"),
		children: statusLabel(status)
	});
}
function Composer({ conversationId, other, balance, onMessages }) {
	const lan = useLan();
	const t = useT();
	const [text, setText] = (0, import_react.useState)("");
	const [payOpen, setPayOpen] = (0, import_react.useState)(false);
	const fileRef = (0, import_react.useRef)(null);
	const textRef = (0, import_react.useRef)(null);
	async function send() {
		const body = text.trim();
		if (!body) return;
		setText("");
		try {
			onMessages(lan.sendText(conversationId, body));
		} catch (err) {
			setText(body);
			toast.error(err instanceof Error ? err.message : "Senden fehlgeschlagen.");
		}
	}
	async function onImage(file) {
		if (!file) return;
		try {
			const media = await fileToMedia(file);
			if (media.mediaType !== "image") {
				toast.error("Im Chat bitte ein Bild senden.");
				return;
			}
			onMessages(lan.sendImage(conversationId, media.mediaUrl));
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Bild fehlgeschlagen.");
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "border-t border-border bg-bg px-3 pt-2",
		style: { paddingBottom: "calc(0.6rem + env(safe-area-inset-bottom))" },
		children: [
			payOpen && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PaySheet, {
				other,
				balance,
				onClose: () => setPayOpen(false),
				onSubmit: async (kind, amount, note) => {
					onMessages(lan.sendPayment(conversationId, kind, amount, note));
					setPayOpen(false);
				}
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				ref: fileRef,
				type: "file",
				accept: "image/*",
				className: "sr-only",
				onChange: (e) => void onImage(e.target.files?.[0])
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-end gap-1.5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "grid size-11 place-items-center rounded-full text-muted hover:text-fg",
						onClick: () => fileRef.current?.click(),
						"aria-label": t("composer.image"),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ImagePlus, { className: "size-5" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "grid size-11 place-items-center rounded-full bg-elevated text-fg",
						onClick: () => setPayOpen((v) => !v),
						"aria-label": t("composer.pay"),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OffxMark, { className: "h-4 w-5" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex min-h-11 flex-1 items-end rounded-xl bg-elevated px-3 py-1.5 shadow-[var(--shadow-border)]",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
							ref: textRef,
							value: text,
							onChange: (e) => setText(e.target.value),
							onKeyDown: (e) => {
								if (e.key === "Enter" && !e.shiftKey) {
									e.preventDefault();
									send();
								}
							},
							rows: 1,
							placeholder: t("composer.placeholder"),
							className: "max-h-28 min-h-8 w-full resize-none bg-transparent py-1.5 text-[15px] text-fg outline-none placeholder:text-faint"
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmojiPicker, { onPick: (e) => {
						setText((prev) => insertEmoji(prev, e, textRef.current));
						requestAnimationFrame(() => textRef.current?.focus());
					} }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: cn("grid size-11 place-items-center rounded-full", text.trim() ? "bg-primary text-primary-foreground" : "text-faint"),
						onClick: () => void send(),
						"aria-label": t("composer.send"),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Send, { className: "size-4" })
					})
				]
			})
		]
	});
}
function PaySheet({ other, balance, onClose, onSubmit }) {
	const [kind, setKind] = (0, import_react.useState)("send");
	const [amount, setAmount] = (0, import_react.useState)("10");
	const [note, setNote] = (0, import_react.useState)("");
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)(null);
	const n = Number(String(amount).replace(",", "."));
	const split = Number.isFinite(n) && n >= 1 ? splitNox(n) : null;
	async function go() {
		setBusy(true);
		setError(null);
		try {
			await onSubmit(kind, amount, note);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Zahlung fehlgeschlagen.");
			setBusy(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mb-3 rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-3 flex items-center justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-sm font-medium",
					children: ["NOX · ", other.displayName]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "text-sm text-muted",
					onClick: onClose,
					children: "Schließen"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mb-4 grid grid-cols-2 gap-1 rounded-lg bg-elevated p-1",
				children: ["send", "request"].map((k) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => setKind(k),
					className: cn("h-10 rounded-md text-sm font-medium transition-colors duration-150", kind === k ? "bg-primary text-primary-foreground" : "text-muted"),
					children: k === "send" ? "Senden" : "Anfordern"
				}, k))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "block",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-[11px] font-medium uppercase tracking-[0.16em] text-muted",
					children: "Betrag"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-1 flex items-baseline gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						value: amount,
						onChange: (e) => setAmount(e.target.value.replace(/[^\d,.]/g, "")),
						inputMode: "decimal",
						className: "w-full bg-transparent font-display text-4xl tabular-nums text-fg outline-none"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-display text-2xl tracking-[0.12em] text-muted",
						children: "NOX"
					})]
				})]
			}),
			split && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-sm leading-relaxed text-muted",
				children: kind === "send" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
					other.displayName,
					" erhält ",
					formatNox(split.net),
					". ",
					formatNox(split.fee),
					" gehen an Offchat."
				] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
					"Du forderst ",
					formatNox(split.gross),
					" — bei dir kommen ",
					formatNox(split.net),
					" an.",
					" ",
					formatNox(split.fee),
					" gehen an Offchat."
				] })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				value: note,
				onChange: (e) => setNote(e.target.value),
				placeholder: "Verwendungszweck",
				maxLength: 80,
				className: "mt-3 h-11 w-full rounded-md border border-border bg-elevated px-3 text-sm outline-none placeholder:text-faint focus-visible:ring-2 focus-visible:ring-ring/60"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-2 text-xs text-muted tabular-nums",
				children: ["Stand ", formatNox(balance)]
			}),
			error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-sm text-destructive",
				children: error
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				className: "mt-3 h-11 w-full rounded-lg",
				disabled: busy,
				onClick: () => void go(),
				children: busy ? "Wird gesendet…" : kind === "send" ? "NOX senden" : "Anfordern"
			})
		]
	});
}
function Thread({ conversationId }) {
	const lan = useLan();
	const data = lan.getThread(conversationId);
	const scroller = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		const el = scroller.current;
		if (!el) return;
		el.scrollTop = el.scrollHeight;
	}, [data?.messages.length]);
	function onResolve(transactionId, action) {
		try {
			lan.resolvePayment(transactionId, action);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Aktion fehlgeschlagen.");
		}
	}
	if (!data) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex h-full flex-col",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ThreadBar, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "p-6 text-sm text-muted",
			children: "Die Person ist nicht (mehr) in diesem Netz. Sobald sie Offchat im selben WLAN öffnet, ist sie wieder da."
		})]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex h-full min-h-0 flex-col bg-bg",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex h-14 items-center gap-2 border-b border-border px-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/messages",
					className: "grid size-11 place-items-center text-fg lg:hidden",
					"aria-label": "Zurück",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { className: "size-6" })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/u/$userId",
					params: { userId: data.other.userId },
					className: "flex min-w-0 items-center gap-2.5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserAvatar, {
						name: data.other.displayName,
						hue: data.other.avatarHue,
						src: data.other.avatarUrl,
						system: data.other.isSystem,
						size: "sm"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "min-w-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "block truncate text-sm font-medium",
							children: data.other.displayName
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "text-xs text-muted",
							children: [
								"@",
								data.other.handle,
								" · hier im Netz"
							]
						})]
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				ref: scroller,
				className: "flex-1 space-y-2 overflow-y-auto px-3 py-4",
				children: data.messages.map((m, i) => {
					const stacked = data.messages[i - 1]?.senderId === m.senderId;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageBubble, {
						message: m,
						mine: m.senderId === data.me.userId,
						other: data.other,
						meId: data.me.userId,
						stacked,
						onResolve: (id, action) => onResolve(id, action)
					}, m.id);
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Composer, {
				conversationId,
				other: data.other,
				balance: lan.me.walletBalance,
				onMessages: () => void 0
			})
		]
	});
}
function ThreadBar() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex h-14 items-center gap-2 border-b border-border px-2",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/messages",
				className: "grid size-11 place-items-center lg:hidden",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { className: "size-6" })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "size-8 rounded-full" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-4 w-28" })
		]
	});
}
function ChatPage() {
	const { conversationId } = Route$2.useParams();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RequireSignIn, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppFrame, {
		hideChrome: true,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex h-dvh min-h-0",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "hidden w-80 shrink-0 border-r border-border lg:block",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Inbox, { activeId: conversationId })
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "min-w-0 flex-1",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Thread, { conversationId })
			})]
		})
	}) });
}
//#endregion
export { ChatPage as component };
