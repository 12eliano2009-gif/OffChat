import { o as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { C as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { O as Bluetooth, T as Download, d as Smartphone, n as Wifi, v as Monitor, w as Globe } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { c as LOCALES, d as cn, i as InstallButton, l as LOCALE_META, o as useSettings, u as Button } from "./router-By-l8WBZ.mjs";
import { a as WLAN_CODE_RE, f as randomWlanCode, g as setForcedLanCode, h as setBtCode, m as readOnlineCode, n as RequireSignIn, p as readBtCode, s as bluetoothNet, t as AppFrame, u as forcedLanNet } from "./signed-in-B-7bejH-.mjs";
import { t as Input } from "./input-CpxBPLku.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/settings-VshPjxpY.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
async function bluetoothAvailable() {
	if (typeof navigator === "undefined") return false;
	const bt = navigator.bluetooth;
	if (!bt) return false;
	try {
		return await bt.getAvailability();
	} catch {
		return true;
	}
}
async function scanOffchatDevice() {
	const bt = navigator.bluetooth;
	if (!bt) throw new Error("no-bt");
	const device = await bt.requestDevice({ filters: [{ namePrefix: "OFFCHAT" }] });
	return {
		name: device.name || "OFFCHAT",
		id: device.id
	};
}
function codeFromDeviceName(name) {
	return name.toUpperCase().match(/OFFCHAT[\s_-]*([A-HJ-NP-Z2-9]{4})/)?.[1] ?? null;
}
var MODES = [
	{
		id: "local",
		icon: Wifi,
		title: "settings.modeLocal",
		hint: "settings.modeLocalHint"
	},
	{
		id: "online",
		icon: Globe,
		title: "settings.modeOnline",
		hint: "settings.modeOnlineHint"
	},
	{
		id: "bluetooth",
		icon: Bluetooth,
		title: "settings.modeBt",
		hint: "settings.modeBtHint"
	}
];
function SettingsView() {
	const s = useSettings();
	const t = s.t;
	const forced = forcedLanNet();
	const bt = bluetoothNet();
	const [code, setCode] = (0, import_react.useState)(readOnlineCode() ?? readBtCode() ?? "");
	const [scanning, setScanning] = (0, import_react.useState)(false);
	function applyMode(mode) {
		s.setMode(mode);
		if (mode === "online" && !readOnlineCode()) {
			const next = randomWlanCode();
			setForcedLanCode(next);
			setCode(next);
		}
		if (mode === "bluetooth") setCode(readBtCode() ?? bt.label.replace("BT ", ""));
		toast.message(t("settings.active"));
		window.setTimeout(() => window.location.reload(), 350);
	}
	function applyCode(e) {
		e.preventDefault();
		const next = code.trim().toUpperCase();
		if (!WLAN_CODE_RE.test(next)) {
			toast.error("K7FP");
			return;
		}
		if (s.mode === "bluetooth") setBtCode(next);
		else {
			setForcedLanCode(next);
			s.setMode("online");
		}
		window.location.reload();
	}
	function makeCode() {
		const next = randomWlanCode();
		setCode(next);
		if (s.mode === "bluetooth") setBtCode(next);
		else {
			setForcedLanCode(next);
			s.setMode("online");
		}
		window.location.reload();
	}
	async function scanBt() {
		setScanning(true);
		try {
			if (!await bluetoothAvailable()) {
				toast.message(t("settings.btUnavailable"));
				return;
			}
			const found = await scanOffchatDevice();
			if (!found) return;
			toast.success(t("settings.btFound", { name: found.name }));
			const extracted = codeFromDeviceName(found.name);
			if (extracted) {
				setBtCode(extracted);
				s.setMode("bluetooth");
				window.location.reload();
			}
		} catch (err) {
			const name = err instanceof Error ? err.message : "";
			if (name !== "no-bt" && !/cancel/i.test(name)) toast.message(t("settings.btUnavailable"));
		} finally {
			setScanning(false);
		}
	}
	const shownCode = s.mode === "bluetooth" ? readBtCode() ?? bt.label.replace("BT ", "") : s.mode === "online" ? forced?.label.replace("Raum ", "") ?? readOnlineCode() : null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto w-full max-w-lg px-4 py-6 tab-safe",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-[11px] font-medium uppercase tracking-[0.22em] text-muted",
				children: "OFFCHAT"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "mt-1 font-display text-2xl tracking-[0.12em]",
				children: t("settings.title")
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-[11px] font-medium uppercase tracking-[0.18em] text-muted",
					children: t("settings.appearance")
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-2 grid grid-cols-2 gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Choice, {
						active: s.theme === "dark",
						onClick: () => s.setTheme("dark"),
						label: t("settings.dark")
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Choice, {
						active: s.theme === "light",
						onClick: () => s.setTheme("light"),
						label: t("settings.light")
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-7",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-[11px] font-medium uppercase tracking-[0.18em] text-muted",
						children: t("settings.mode")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-2 space-y-2",
						children: MODES.map((m) => {
							const Icon = m.icon;
							const active = s.mode === m.id;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: () => applyMode(m.id),
								className: cn("flex w-full items-start gap-3 rounded-2xl p-4 text-left shadow-[var(--shadow-border)] transition-colors duration-150", active ? "bg-fg text-bg" : "bg-surface text-fg hover:bg-elevated"),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "mt-0.5 size-5 shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "block text-sm font-medium",
									children: t(m.title)
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: cn("mt-0.5 block text-xs leading-relaxed", active ? "text-bg/70" : "text-muted"),
									children: t(m.hint)
								})] })]
							}, m.id);
						})
					}),
					s.mode !== "local" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						onSubmit: applyCode,
						className: "mt-3 rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm font-medium",
								children: t("settings.code")
							}),
							shownCode && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 font-display text-3xl tracking-[0.28em]",
								children: shownCode
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-3 flex gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: code,
									onChange: (e) => setCode(e.target.value.toUpperCase()),
									placeholder: "K7FP",
									maxLength: 4,
									className: "h-11 font-display tracking-[0.3em]"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									type: "submit",
									className: "h-11 rounded-lg px-4",
									children: t("settings.codeApply")
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "button",
								variant: "secondary",
								className: "mt-2 h-11 w-full rounded-lg",
								onClick: makeCode,
								children: t("settings.codeMake")
							}),
							s.mode === "bluetooth" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								type: "button",
								variant: "secondary",
								className: "mt-2 h-11 w-full rounded-lg",
								disabled: scanning,
								onClick: () => void scanBt(),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bluetooth, { className: "size-4" }), scanning ? t("settings.btScanning") : t("settings.btScan")]
							})
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-7",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-[11px] font-medium uppercase tracking-[0.18em] text-muted",
					children: t("settings.language")
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-2 grid grid-cols-1 gap-1.5",
					children: LOCALES.map((loc) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => s.setLocale(loc),
						className: cn("flex h-12 items-center justify-between rounded-xl px-4 text-sm font-medium", s.locale === loc ? "bg-fg text-bg" : "bg-surface text-fg"),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: LOCALE_META[loc].native }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: cn("text-xs", s.locale === loc ? "text-bg/70" : "text-muted"),
							children: LOCALE_META[loc].short
						})]
					}, loc))
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-7 space-y-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-[11px] font-medium uppercase tracking-[0.18em] text-muted",
						children: t("settings.downloads")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DownloadRow, {
						href: "/api/native?kind=exe",
						icon: Monitor,
						title: t("settings.dllWindows"),
						hint: t("settings.dllWindowsHint")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DownloadRow, {
						href: "/api/native?kind=apk",
						icon: Smartphone,
						title: t("settings.dllAndroid"),
						hint: t("settings.dllAndroidHint")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm font-medium",
							children: t("settings.dllPwa")
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-3",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(InstallButton, {})
						})]
					})
				]
			})
		]
	});
}
function Choice({ active, onClick, label }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		onClick,
		className: cn("h-12 rounded-xl text-sm font-medium", active ? "bg-fg text-bg" : "bg-surface text-fg"),
		children: label
	});
}
function DownloadRow({ href, icon: Icon, title, hint }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
		href,
		className: "flex items-start gap-3 rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "grid size-11 shrink-0 place-items-center rounded-xl bg-elevated",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-5" })
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
			className: "flex items-center gap-2 text-sm font-medium",
			children: [title, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "size-3.5 text-muted" })]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "mt-0.5 block text-xs leading-relaxed text-muted",
			children: hint
		})] })]
	});
}
function SettingsPage() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RequireSignIn, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppFrame, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsView, {}) }) });
}
//#endregion
export { SettingsPage as component };
