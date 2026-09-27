import { o as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { C as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as formatNox, d as relTime, f as splitNox, i as formatEuro, t as NOX_PACKS } from "./packs-txKK3gaA.mjs";
import { A as ArrowDownLeft, k as ArrowUpRight, n as Wifi, r as WifiOff, w as Globe } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { d as cn, o as useSettings, u as Button } from "./router-By-l8WBZ.mjs";
import { t as Skeleton } from "./skeleton-DPoB2_JI.mjs";
import { _ as topUp, a as WLAN_CODE_RE, b as useOnline, c as cacheGet, d as getWallet, f as randomWlanCode, g as setForcedLanCode, l as cacheSet, n as RequireSignIn, o as assertOnline, t as AppFrame, u as forcedLanNet, y as useLan } from "./signed-in-B-7bejH-.mjs";
import { t as Input } from "./input-CpxBPLku.mjs";
import { t as Label } from "./label-DUjhxCrZ.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/online-BaQW28f-.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/** Client-side card checks. Full PAN never leaves the device. */
function digitsOnly(value) {
	return value.replace(/\D/g, "");
}
function luhnOk(num) {
	const d = digitsOnly(num);
	if (d.length < 13 || d.length > 19) return false;
	let sum = 0;
	let alt = false;
	for (let i = d.length - 1; i >= 0; i -= 1) {
		let n = Number(d[i]);
		if (alt) {
			n *= 2;
			if (n > 9) n -= 9;
		}
		sum += n;
		alt = !alt;
	}
	return sum % 10 === 0;
}
function cardBrand(num) {
	const d = digitsOnly(num);
	if (/^4/.test(d)) return "visa";
	if (/^5[1-5]/.test(d) || /^2[2-7]/.test(d)) return "mastercard";
	if (/^3[47]/.test(d)) return "amex";
	return "card";
}
function formatCardNumber(raw) {
	const d = digitsOnly(raw).slice(0, 19);
	if (cardBrand(d) === "amex") return [
		d.slice(0, 4),
		d.slice(4, 10),
		d.slice(10, 15)
	].filter(Boolean).join(" ");
	return d.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}
function parseExpiry(raw) {
	const d = digitsOnly(raw).slice(0, 4);
	if (d.length < 4) return null;
	const month = Number(d.slice(0, 2));
	const year = 2e3 + Number(d.slice(2, 4));
	if (month < 1 || month > 12) return null;
	return {
		month,
		year
	};
}
function expiryOk(month, year) {
	if (month < 1 || month > 12) return false;
	const now = /* @__PURE__ */ new Date();
	const ym = now.getFullYear() * 12 + now.getMonth();
	return year * 12 + (month - 1) >= ym;
}
function formatExpiry(raw) {
	const d = digitsOnly(raw).slice(0, 4);
	if (d.length <= 2) return d;
	return `${d.slice(0, 2)} / ${d.slice(2)}`;
}
function readCardForm(input) {
	const holder = input.holder.trim().replace(/\s+/g, " ");
	if (holder.length < 3) throw new Error("Name auf der Karte fehlt.");
	const number = digitsOnly(input.number);
	if (!luhnOk(number)) throw new Error("Kartennummer ist ungültig.");
	const brand = cardBrand(number);
	const needCvc = brand === "amex" ? 4 : 3;
	if (digitsOnly(input.cvc).length !== needCvc) throw new Error("Prüfnummer (CVC) ist ungültig.");
	const exp = parseExpiry(input.expiry);
	if (!exp || !expiryOk(exp.month, exp.year)) throw new Error("Ablaufdatum ist ungültig.");
	return {
		holder: holder.slice(0, 48),
		last4: number.slice(-4),
		brand,
		expMonth: exp.month,
		expYear: exp.year
	};
}
function WalletView() {
	const lan = useLan();
	const [data, setData] = (0, import_react.useState)(null);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [pick, setPick] = (0, import_react.useState)(null);
	const online = useOnline();
	async function reload() {
		try {
			const next = await getWallet();
			setData(next);
			lan.setMe(next.profile);
			await cacheSet("wallet", next);
		} catch {
			const cached = await cacheGet("wallet");
			if (cached) setData(cached);
			else setData({
				profile: lan.me,
				transactions: []
			});
		}
	}
	(0, import_react.useEffect)(() => {
		reload();
	}, []);
	async function buy(pack, card) {
		setBusy(true);
		try {
			assertOnline();
			const next = await topUp({ data: {
				packId: pack.id,
				holder: card.holder,
				last4: card.last4,
				brand: card.brand,
				expMonth: card.expMonth,
				expYear: card.expYear
			} });
			setData(next);
			lan.setMe(next.profile);
			toast.success(`${formatNox(pack.nox)} für ${formatEuro(pack.euro)}.`);
			setPick(null);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Zahlung fehlgeschlagen.");
		} finally {
			setBusy(false);
		}
	}
	if (!data) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-lg space-y-4 px-4 py-8 tab-safe",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-8 w-40" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-28 w-full rounded-2xl" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-48 w-full rounded-2xl" })
		]
	});
	const demo = splitNox("10");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto w-full max-w-lg px-4 py-6 tab-safe",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-display text-2xl tracking-[0.12em]",
				children: "NOX holen"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-5 rounded-2xl bg-surface p-5 shadow-[var(--shadow-border)]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[11px] font-medium uppercase tracking-[0.18em] text-muted",
						children: "Dein Stand"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 font-display text-5xl tracking-wide tabular-nums",
						children: formatNox(data.profile.walletBalance)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-3 max-w-sm text-sm leading-relaxed text-muted",
						children: [
							"10 NOX kosten ",
							formatEuro(.99),
							". Wer ",
							formatNox(demo.gross),
							" sendet, gibt",
							" ",
							formatNox(demo.net),
							" weiter. ",
							formatNox(demo.fee),
							" bleiben bei Offchat."
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-sm font-medium",
						children: "NOX holen"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-xs text-muted",
						children: "Nur mit Internet und Karte. Größere Packs sind etwas günstiger."
					}),
					!online && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-3 flex items-center gap-2 text-sm text-warn",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(WifiOff, { className: "size-4" }), "Du bist ohne Internet. Packs gehen nur im Tab Online."]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "mt-3 divide-y divide-border overflow-hidden rounded-xl bg-surface shadow-[var(--shadow-border)]",
						children: NOX_PACKS.map((pack) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							disabled: busy || !online,
							onClick: () => setPick(pack),
							className: "flex w-full items-center gap-3 px-4 py-3 text-left disabled:opacity-40",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "min-w-0 flex-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "block text-sm font-medium",
									children: formatNox(pack.nox)
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "text-xs text-muted",
									children: [
										formatEuro(pack.euro / pack.nox),
										" / NOX",
										pack.savePct > 0 ? ` · −${pack.savePct} %` : ""
									]
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-sm font-medium tabular-nums",
								children: formatEuro(pack.euro)
							})]
						}) }, pack.id))
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-8",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mb-2 text-sm font-medium",
					children: "Verlauf"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
					className: "divide-y divide-border rounded-xl bg-surface shadow-[var(--shadow-border)]",
					children: [data.transactions.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
						className: "px-4 py-6 text-sm text-muted",
						children: "Noch keine Bewegungen."
					}), data.transactions.map((tx) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LedgerRow, {
						tx,
						meId: data.profile.userId
					}, tx.id))]
				})]
			}),
			pick && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CheckoutSheet, {
				pack: pick,
				busy,
				onClose: () => !busy && setPick(null),
				onPay: (card) => void buy(pick, card)
			})
		]
	});
}
function CheckoutSheet({ pack, busy, onClose, onPay }) {
	const [holder, setHolder] = (0, import_react.useState)("");
	const [number, setNumber] = (0, import_react.useState)("");
	const [expiry, setExpiry] = (0, import_react.useState)("");
	const [cvc, setCvc] = (0, import_react.useState)("");
	const [error, setError] = (0, import_react.useState)(null);
	function submit(e) {
		e.preventDefault();
		setError(null);
		try {
			onPay(readCardForm({
				holder,
				number,
				expiry,
				cvc
			}));
		} catch (err) {
			setError(err instanceof Error ? err.message : "Karte prüfen.");
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-50 flex items-end justify-center bg-bg/70 p-3 lg:items-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
			onSubmit: submit,
			className: "w-full max-w-md rounded-2xl bg-surface p-5 shadow-[var(--shadow-lift)]",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-display text-xl tracking-[0.12em]",
					children: "ZAHLEN"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-2 text-sm leading-relaxed text-muted",
					children: [
						formatNox(pack.nox),
						" für ",
						formatEuro(pack.euro),
						pack.savePct > 0 ? ` · ${pack.savePct} % Mengenrabatt` : "",
						". Mit Karte — ohne Karte kein NOX."
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 font-display text-4xl tabular-nums",
					children: formatEuro(pack.euro)
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-5 space-y-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "nox-holder",
								children: "Name auf der Karte"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								id: "nox-holder",
								value: holder,
								autoComplete: "cc-name",
								onChange: (e) => setHolder(e.target.value),
								required: true
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "nox-number",
								children: "Kartennummer"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								id: "nox-number",
								inputMode: "numeric",
								autoComplete: "cc-number",
								value: number,
								onChange: (e) => setNumber(formatCardNumber(e.target.value)),
								placeholder: "ACCT-000015",
								required: true
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid grid-cols-2 gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									htmlFor: "nox-exp",
									children: "Gültig bis"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									id: "nox-exp",
									inputMode: "numeric",
									autoComplete: "cc-exp",
									value: expiry,
									onChange: (e) => setExpiry(formatExpiry(e.target.value)),
									placeholder: "MM / YY",
									required: true
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									htmlFor: "nox-cvc",
									children: "CVC"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									id: "nox-cvc",
									inputMode: "numeric",
									autoComplete: "cc-csc",
									value: cvc,
									onChange: (e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 4)),
									placeholder: "123",
									required: true
								})]
							})]
						})
					]
				}),
				error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-sm text-destructive",
					children: error
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-[11px] leading-relaxed text-faint",
					children: "Die Kartennummer bleibt auf dem Gerät. Offchat speichert nur die letzten vier Stellen."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-5 grid grid-cols-2 gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						variant: "secondary",
						className: "h-12 rounded-lg",
						disabled: busy,
						onClick: onClose,
						children: "Abbrechen"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "submit",
						className: "h-12 rounded-lg",
						disabled: busy,
						children: busy ? "Zahlt…" : `${formatEuro(pack.euro)} zahlen`
					})]
				})
			]
		})
	});
}
function LedgerRow({ tx, meId }) {
	const incoming = tx.kind === "topup" || tx.kind === "send" && tx.recipientId === meId && tx.status === "completed" || tx.kind === "request" && tx.senderId === meId && tx.status === "completed";
	const shown = incoming && tx.kind !== "topup" && tx.status === "completed" ? tx.net : tx.amount;
	const label = tx.kind === "topup" ? tx.note || "NOX geholt" : tx.kind === "cashout" ? "NOX zurück" : tx.note || (tx.kind === "request" ? "Anfrage" : "NOX");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
		className: "flex items-center gap-3 px-4 py-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "grid size-9 place-items-center rounded-full bg-elevated text-muted",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(incoming ? ArrowDownLeft : ArrowUpRight, { className: "size-4" })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "min-w-0 flex-1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "truncate text-sm font-medium",
					children: label
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-xs text-muted",
					children: [
						relTime(tx.createdAt),
						" ·",
						" ",
						tx.status === "completed" ? "fertig" : tx.status === "pending" ? "offen" : "abgelehnt"
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: cn("text-sm font-medium tabular-nums", incoming && tx.status === "completed" ? "text-success" : "text-fg"),
				children: [incoming && tx.status === "completed" ? "+" : tx.kind === "cashout" || tx.kind === "send" && tx.senderId === meId ? "−" : "", formatNox(shown)]
			})
		]
	});
}
function OnlineView() {
	const lan = useLan();
	const { t, setMode } = useSettings();
	const online = useOnline();
	const connected = lan.peers.filter((p) => p.connectionState === "connected").length;
	const here = Math.max(lan.people.length, connected);
	const forced = forcedLanNet();
	const [code, setCode] = (0, import_react.useState)("");
	function applyCode(e) {
		e.preventDefault();
		const next = code.trim().toUpperCase();
		if (!WLAN_CODE_RE.test(next)) {
			toast.error("Vier Zeichen, ohne 0/O/1/I.");
			return;
		}
		setForcedLanCode(next);
		setMode("online");
		toast.success(`Raum ${next}.`);
		window.location.reload();
	}
	function makeCode() {
		const next = randomWlanCode();
		setForcedLanCode(next);
		setMode("online");
		toast.success(`Raum ${next}.`);
		window.location.reload();
	}
	function clearCode() {
		setForcedLanCode(null);
		setMode("local");
		window.location.reload();
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto w-full max-w-lg tab-safe",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "px-4 pt-6",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-[11px] font-medium uppercase tracking-[0.22em] text-muted",
					children: t("online.kicker")
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-1 font-display text-2xl tracking-[0.12em]",
					children: t("online.title")
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm leading-relaxed text-muted",
					children: t("online.body")
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-5 grid grid-cols-2 gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusCard, {
						icon: Wifi,
						label: t("online.net"),
						value: lan.net?.label ?? "…",
						detail: here ? `${here} ${here === 1 ? "Person" : "Personen"} hier` : lan.joined ? "warte auf Geräte" : "sucht…"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusCard, {
						icon: Globe,
						label: t("online.web"),
						value: online ? t("online.on") : t("online.off"),
						detail: online ? t("online.nox") : t("online.localOnly")
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					onSubmit: applyCode,
					className: "mt-5 rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm font-medium",
							children: t("online.room")
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-xs leading-relaxed text-muted",
							children: t("online.roomHint")
						}),
						forced ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-3 flex items-center justify-between",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-display text-xl tracking-[0.28em]",
								children: forced.label.replace("Raum ", "")
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "button",
								variant: "secondary",
								className: "h-10 rounded-lg",
								onClick: clearCode,
								children: t("online.auto")
							})]
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-3 space-y-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: code,
									onChange: (e) => setCode(e.target.value.toUpperCase()),
									placeholder: "K7FP",
									maxLength: 4,
									className: "h-11 font-display tracking-[0.3em]"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									type: "submit",
									className: "h-11 rounded-lg px-4",
									children: t("online.set")
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "button",
								variant: "secondary",
								className: "h-11 w-full rounded-lg",
								onClick: makeCode,
								children: t("online.make")
							})]
						})
					]
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WalletView, {})]
	});
}
function StatusCard({ icon: Icon, label, value, detail }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.16em] text-muted",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-3.5" }), label]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-sm font-medium",
				children: value
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-0.5 text-xs text-muted",
				children: detail
			})
		]
	});
}
function OnlinePage() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RequireSignIn, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppFrame, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OnlineView, {}) }) });
}
//#endregion
export { OnlinePage as component };
