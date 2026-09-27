import { o as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { C as require_jsx_runtime, f as useRouterState, x as useNavigate, y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { d as relTime, i as formatEuro } from "./packs-txKK3gaA.mjs";
import { C as Heart, _ as Moon, d as Smartphone, g as Play, n as Wifi, o as Trash2, s as Sun, v as Monitor, y as MessageCircle } from "../_libs/lucide-react.mjs";
import { c as LOCALES, d as cn, i as InstallButton, l as LOCALE_META, o as useSettings, s as useT, u as Button } from "./router-By-l8WBZ.mjs";
import { r as useCurrentUserState, t as Skeleton } from "./skeleton-DPoB2_JI.mjs";
import { i as VerifyGate, t as AppFrame, y as useLan } from "./signed-in-B-7bejH-.mjs";
import { t as UserAvatar } from "./avatar-COyG8STG.mjs";
import { t as Input } from "./input-CpxBPLku.mjs";
import { t as EmojiPicker } from "./emoji-picker-DM86Gaf2.mjs";
import { t as AuthForm } from "./auth-form-cM0hRC4H.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-DEHbUo89.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function PostCard({ post }) {
	const lan = useLan();
	const t = useT();
	const navigate = useNavigate();
	const lastTap = (0, import_react.useRef)(0);
	const [commentsOpen, setCommentsOpen] = (0, import_react.useState)(false);
	const [draft, setDraft] = (0, import_react.useState)("");
	const comments = lan.commentsFor(post.id);
	const mine = post.author.userId === lan.me.userId;
	const [confirmDelete, setConfirmDelete] = (0, import_react.useState)(false);
	function onMediaClick() {
		const now = Date.now();
		if (now - lastTap.current < 320) {
			if (!post.liked) lan.toggleLike(post.id);
		}
		lastTap.current = now;
	}
	function submitComment(e) {
		e.preventDefault();
		const body = draft.trim();
		if (!body) return;
		lan.addComment(post.id, body);
		setDraft("");
	}
	function messageAuthor() {
		const id = lan.openConversation(post.author.userId);
		navigate({
			to: "/c/$conversationId",
			params: { conversationId: id }
		});
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		className: "border-b border-border pb-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "flex items-center gap-3 px-4 py-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/u/$userId",
						params: { userId: post.author.userId },
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserAvatar, {
							name: post.author.displayName,
							hue: post.author.avatarHue,
							src: post.author.avatarUrl,
							system: post.author.isSystem,
							size: "sm"
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0 flex-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/u/$userId",
							params: { userId: post.author.userId },
							className: "block truncate text-sm font-medium",
							children: post.author.displayName
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-xs text-muted",
							children: [
								"@",
								post.author.handle,
								" · ",
								relTime(post.createdAt)
							]
						})]
					}),
					mine ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => setConfirmDelete(true),
						className: "flex h-11 items-center gap-1.5 text-xs font-medium text-muted hover:text-destructive",
						"aria-label": "Beitrag löschen",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-4" }), "Löschen"]
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: messageAuthor,
						className: "text-xs font-medium text-muted hover:text-fg",
						children: "Chat"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "relative block w-full",
				onClick: onMediaClick,
				children: post.mediaType === "video" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
					src: post.mediaUrl,
					poster: post.posterUrl ?? void 0,
					className: "aspect-[4/5] w-full object-cover",
					muted: true,
					loop: true,
					playsInline: true,
					autoPlay: true
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "pointer-events-none absolute right-3 top-3 grid size-8 place-items-center rounded-full bg-bg/55 text-fg",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, {
						className: "size-3.5",
						fill: "currentColor"
					})
				})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					src: post.mediaUrl,
					alt: post.caption,
					className: "aspect-[4/5] w-full object-cover"
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-1 px-3 pt-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => lan.toggleLike(post.id),
					className: "grid size-11 place-items-center",
					"aria-label": "Gefällt mir",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Heart, {
						className: cn("size-6", post.liked && "fill-destructive text-destructive"),
						strokeWidth: 1.7
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => setCommentsOpen(true),
					className: "grid size-11 place-items-center",
					"aria-label": "Kommentare",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageCircle, {
						className: "size-6",
						strokeWidth: 1.7
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "px-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-sm font-medium tabular-nums",
						children: [
							post.likeCount,
							" ",
							post.likeCount === 1 ? "Like" : "Likes"
						]
					}),
					post.caption && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-1 text-sm leading-relaxed",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-medium",
								children: post.author.handle
							}),
							" ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-fg/90",
								children: post.caption
							})
						]
					}),
					post.commentCount > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "mt-1 text-sm text-muted",
						onClick: () => setCommentsOpen(true),
						children: t("feed.comments", { n: post.commentCount })
					})
				]
			}),
			commentsOpen && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-4 mt-3 rounded-xl bg-surface p-3 shadow-[var(--shadow-border)]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "max-h-48 space-y-2 overflow-y-auto",
					children: [comments.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-sm",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-medium",
								children: c.author.handle
							}),
							" ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-fg/90",
								children: c.body
							})
						]
					}, c.id)), comments.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted",
						children: t("feed.noComments")
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					onSubmit: submitComment,
					className: "mt-2 flex items-center gap-1",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: draft,
							onChange: (e) => setDraft(e.target.value),
							placeholder: t("feed.comment"),
							className: "h-10"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmojiPicker, { onPick: (e) => setDraft((prev) => prev + e) }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "submit",
							size: "sm",
							className: "h-10 rounded-md px-3",
							children: t("composer.send")
						})
					]
				})]
			}),
			confirmDelete && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
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
								onClick: () => setConfirmDelete(false),
								children: "Abbrechen"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "destructive",
								className: "h-11 rounded-lg",
								onClick: () => {
									lan.deletePost(post.id);
									setConfirmDelete(false);
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
function Feed() {
	const lan = useLan();
	const t = useT();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto w-full max-w-lg tab-safe",
		children: [lan.people.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PeopleStrip, { people: lan.people }), lan.posts.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyFeed, {
			hasPeople: lan.people.length > 0,
			net: lan.net?.label ?? t("lan.local"),
			joined: lan.joined,
			people: lan.people.length
		}) : lan.posts.map((post) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PostCard, { post }, post.id))]
	});
}
function PeopleStrip({ people }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "no-scrollbar flex gap-4 overflow-x-auto border-b border-border px-4 py-4",
		children: people.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
			to: "/u/$userId",
			params: { userId: p.userId },
			className: "flex w-16 shrink-0 flex-col items-center gap-1",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "rounded-full p-px ring-1 ring-fg/70",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserAvatar, {
					name: p.displayName,
					hue: p.avatarHue,
					src: p.avatarUrl
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "w-full truncate text-center text-[11px] text-muted",
				children: p.handle
			})]
		}, p.userId))
	});
}
function EmptyFeed({ hasPeople, net, joined, people }) {
	const t = useT();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col items-center px-8 py-16 text-center",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "grid size-14 place-items-center rounded-full bg-elevated",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wifi, { className: "size-6 text-fg" })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-5 font-display text-2xl tracking-[0.12em]",
				children: t("feed.emptyTitle")
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-sm text-muted",
				children: net
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 max-w-xs text-pretty text-sm leading-relaxed text-muted",
				children: !joined ? t("feed.searching") : people === 0 ? t("feed.nobody") : hasPeople ? t("feed.searching") : t("feed.nobody")
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/create",
				className: "mt-6 inline-flex h-11 items-center rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground",
				children: t("create.title")
			})
		]
	});
}
function Landing() {
	const { t, locale, setLocale, theme, setTheme } = useSettings();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "relative min-h-dvh bg-bg text-fg",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src: "/brand/offx-hero.jpg",
				alt: "",
				className: "absolute inset-0 size-full object-cover object-top"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-0 bg-gradient-to-t from-bg via-bg/75 to-bg/25" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative z-10 mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pb-8 pt-16",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex justify-end gap-2 pr-16",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "grid size-9 place-items-center rounded-full bg-surface/80 text-fg backdrop-blur",
								onClick: () => setTheme(theme === "light" ? "dark" : "light"),
								"aria-label": theme === "light" ? t("settings.dark") : t("settings.light"),
								children: theme === "light" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Moon, { className: "size-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sun, { className: "size-4" })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "sr-only",
								htmlFor: "offchat-lang",
								children: t("settings.language")
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
								id: "offchat-lang",
								value: locale,
								onChange: (e) => setLocale(e.target.value),
								className: "h-9 rounded-full bg-surface/80 px-3 text-[11px] font-medium text-fg backdrop-blur outline-none",
								children: LOCALES.map((loc) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: loc,
									children: LOCALE_META[loc].short
								}, loc))
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-2 pr-20",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[11px] font-medium uppercase tracking-[0.28em] text-muted",
								children: t("landing.kicker")
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
								className: "font-display text-4xl tracking-[0.1em] text-fg lg:text-5xl lg:tracking-[0.12em]",
								children: "OFFCHAT"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "max-w-sm text-pretty text-sm leading-relaxed text-muted",
								children: t("landing.body")
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-auto space-y-3 pt-6",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid grid-cols-3 gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PlatformChip, {
									icon: Smartphone,
									label: "Android"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PlatformChip, {
									icon: Smartphone,
									label: "iPhone"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PlatformChip, {
									icon: Monitor,
									label: "PC & Mac"
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-3 rounded-2xl bg-surface/90 p-5 shadow-[var(--shadow-border)] backdrop-blur-md",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid grid-cols-2 gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
										href: "/api/native?kind=apk",
										className: "flex h-11 items-center justify-center rounded-lg bg-elevated text-sm font-medium",
										children: "APK"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
										href: "/api/native?kind=exe",
										className: "flex h-11 items-center justify-center rounded-lg bg-elevated text-sm font-medium",
										children: "EXE"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InstallButton, {}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
									to: "/get",
									className: "block text-center text-sm text-muted underline-offset-4 hover:underline",
									children: t("landing.how")
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-center text-[11px] uppercase tracking-[0.18em] text-faint",
									children: t("landing.signin")
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuthForm, { compact: true }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-center text-xs text-faint",
									children: [
										"10 NOX = ",
										formatEuro(.99),
										" · 70 % kommen an"
									]
								})
							]
						})]
					})
				]
			})
		]
	});
}
function PlatformChip({ icon: Icon, label }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col items-center gap-1 rounded-xl bg-surface/80 px-2 py-3 backdrop-blur",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-4 text-fg" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "text-[11px] text-muted",
			children: label
		})]
	});
}
function Home() {
	const cookieUser = useRouterState({ select: (s) => {
		return (s.matches.find((m) => m.routeId === "__root__")?.context)?.sessionUser ?? null;
	} });
	const { user, isPending } = useCurrentUserState();
	if (user) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VerifyGate, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppFrame, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Feed, {}) }) });
	if (isPending && cookieUser) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "flex min-h-dvh items-center justify-center bg-bg",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-12 w-36 rounded-lg" })
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Landing, {});
}
//#endregion
export { Home as component };
