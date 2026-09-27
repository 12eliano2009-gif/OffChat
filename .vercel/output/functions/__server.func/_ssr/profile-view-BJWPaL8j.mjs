import { o as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { C as require_jsx_runtime, x as useNavigate, y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as formatNox } from "./packs-txKK3gaA.mjs";
import { D as Camera, o as Trash2, p as Settings } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { a as InviteButton, i as InstallButton, u as Button } from "./router-By-l8WBZ.mjs";
import { n as useCurrentUser } from "./skeleton-DPoB2_JI.mjs";
import { r as UserButton, v as updateProfile, y as useLan } from "./signed-in-B-7bejH-.mjs";
import { t as UserAvatar } from "./avatar-COyG8STG.mjs";
import { t as Input } from "./input-CpxBPLku.mjs";
import { t as fileToAvatar } from "./media-Da3cWhLi.mjs";
import { t as Textarea } from "./textarea-ojDkDu2U.mjs";
import { t as Label } from "./label-DUjhxCrZ.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/profile-view-BJWPaL8j.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function ProfileView({ userId }) {
	const lan = useLan();
	const navigate = useNavigate();
	const authUser = useCurrentUser();
	const fileRef = (0, import_react.useRef)(null);
	const [editing, setEditing] = (0, import_react.useState)(false);
	const [name, setName] = (0, import_react.useState)(lan.me.displayName);
	const [handle, setHandle] = (0, import_react.useState)(lan.me.handle);
	const [bio, setBio] = (0, import_react.useState)(lan.me.bio);
	const [photo, setPhoto] = (0, import_react.useState)(lan.me.avatarUrl);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [pendingDelete, setPendingDelete] = (0, import_react.useState)(null);
	const own = !userId || userId === lan.me.userId;
	const profile = own ? lan.me : lan.people.find((p) => p.userId === userId) ?? lan.posts.find((p) => p.author.userId === userId)?.author;
	const posts = lan.posts.filter((p) => p.author.userId === (profile?.userId ?? lan.me.userId));
	if (!profile) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "mx-auto max-w-lg px-4 py-16 text-center text-sm text-muted tab-safe",
		children: "Nicht in diesem Netz. Wenn die Person Offchat im selben WLAN öffnet, ist sie hier."
	});
	const shown = profile;
	async function onPhoto(file) {
		if (!file) return;
		try {
			const url = await fileToAvatar(file);
			setPhoto(url);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Foto ungültig.");
		}
	}
	async function save() {
		setBusy(true);
		try {
			const next = await updateProfile({ data: {
				displayName: name,
				handle,
				bio,
				avatarUrl: photo
			} });
			lan.setMe(next);
			setEditing(false);
		} catch (err) {
			const cleanHandle = handle.trim().toLowerCase().replace(/^@/, "").replace(/[^a-z0-9_]/g, "").slice(0, 20);
			lan.setMe({
				...lan.me,
				displayName: name.trim().slice(0, 40) || lan.me.displayName,
				handle: cleanHandle.length >= 2 ? cleanHandle : lan.me.handle,
				bio,
				avatarUrl: photo
			});
			setEditing(false);
			toast.message(err instanceof Error ? err.message : "Lokal gespeichert.");
		} finally {
			setBusy(false);
		}
	}
	function message() {
		const id = lan.openConversation(shown.userId);
		navigate({
			to: "/c/$conversationId",
			params: { conversationId: id }
		});
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto w-full max-w-lg px-4 py-6 tab-safe",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start gap-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						className: "relative shrink-0",
						disabled: !own || !editing,
						onClick: () => editing && fileRef.current?.click(),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserAvatar, {
							name: editing ? name || shown.displayName : shown.displayName,
							hue: shown.avatarHue,
							src: editing ? photo : shown.avatarUrl,
							system: shown.isSystem,
							size: "xl"
						}), own && editing && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "absolute bottom-0 right-0 grid size-8 place-items-center rounded-full bg-fg text-bg",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Camera, { className: "size-3.5" })
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						ref: fileRef,
						type: "file",
						accept: "image/*",
						className: "sr-only",
						onChange: (e) => void onPhoto(e.target.files?.[0])
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0 flex-1",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
								className: "truncate text-xl font-medium",
								children: shown.displayName
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-sm text-muted",
								children: ["@", shown.handle]
							}),
							own && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-sm tabular-nums text-muted",
								children: formatNox(shown.walletBalance)
							})
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-4 text-sm leading-relaxed text-fg/90",
				children: shown.bio || (own ? "Noch keine Bio." : "")
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-2 text-sm text-muted",
				children: [
					posts.length,
					" ",
					posts.length === 1 ? "Beitrag" : "Beiträge",
					" in diesem Netz"
				]
			}),
			own && editing && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-5 space-y-3 rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "offx-nick",
							children: "Nickname"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							id: "offx-nick",
							value: name,
							onChange: (e) => setName(e.target.value),
							maxLength: 40,
							placeholder: "Wie dich Leute sehen"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "offx-handle",
							children: "Username"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "relative",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-faint",
								children: "@"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								id: "offx-handle",
								value: handle,
								onChange: (e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "")),
								maxLength: 20,
								className: "pl-7",
								placeholder: "username"
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "offx-bio",
							children: "Bio"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
							id: "offx-bio",
							value: bio,
							onChange: (e) => setBio(e.target.value),
							maxLength: 140
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							className: "h-11 rounded-md",
							disabled: busy,
							onClick: () => void save(),
							children: busy ? "Speichert…" : "Speichern"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "secondary",
							className: "h-11 rounded-md",
							disabled: busy,
							onClick: () => {
								setName(lan.me.displayName);
								setHandle(lan.me.handle);
								setBio(lan.me.bio);
								setPhoto(lan.me.avatarUrl);
								setEditing(false);
							},
							children: "Abbrechen"
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 flex flex-wrap items-center gap-2",
				children: [
					own && !editing && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "secondary",
						className: "h-10 rounded-md",
						onClick: () => {
							setName(lan.me.displayName);
							setHandle(lan.me.handle);
							setBio(lan.me.bio);
							setPhoto(lan.me.avatarUrl);
							setEditing(true);
						},
						children: "Profil bearbeiten"
					}),
					!own && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						className: "h-10 rounded-md",
						onClick: message,
						children: "Nachricht"
					}),
					own && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/settings",
						className: "inline-flex h-10 items-center gap-2 rounded-md bg-secondary px-3 text-sm font-medium text-secondary-foreground",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Settings, { className: "size-4" }), "Einstellungen"]
					}),
					own && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "ml-auto text-sm",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserButton, {})
					})
				]
			}),
			own && authUser?.primaryEmail && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-xs text-faint",
				children: authUser.primaryEmail
			}),
			own && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-6 space-y-3 rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm font-medium",
						children: "Aufs Gerät holen"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs leading-relaxed text-muted",
						children: "Dann läuft Offchat als App in jedem WLAN — Café, WG, Festival."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InstallButton, {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InviteButton, { handle: shown.handle })
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-6 grid grid-cols-3 gap-1",
				children: [posts.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "col-span-3 py-10 text-center text-sm text-muted",
					children: "Noch keine Beiträge."
				}), posts.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative aspect-square overflow-hidden bg-elevated",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/",
						className: "block size-full",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: p.posterUrl || p.mediaUrl,
							alt: p.caption,
							className: "size-full object-cover"
						})
					}), own && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "absolute right-1 top-1 grid size-9 place-items-center rounded-full bg-bg/80 text-fg",
						"aria-label": "Beitrag löschen",
						onClick: () => setPendingDelete(p.id),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-3.5" })
					})]
				}, p.id))]
			}),
			pendingDelete && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "fixed inset-0 z-50 flex items-end justify-center bg-bg/70 p-3 lg:items-center",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "w-full max-w-sm rounded-2xl bg-surface p-5 shadow-[var(--shadow-lift)]",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm font-medium",
							children: "Beitrag löschen?"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-sm leading-relaxed text-muted",
							children: "Weg in diesem Netz — bei dir und bei allen, die Offchat hier offen haben."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-4 grid grid-cols-2 gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "secondary",
								className: "h-11 rounded-lg",
								onClick: () => setPendingDelete(null),
								children: "Abbrechen"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "destructive",
								className: "h-11 rounded-lg",
								onClick: () => {
									lan.deletePost(pendingDelete);
									setPendingDelete(null);
								},
								children: "Löschen"
							})]
						})
					]
				})
			})
		]
	});
}
//#endregion
export { ProfileView as t };
