import { C as require_jsx_runtime, y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { T as Download, d as Smartphone, v as Monitor } from "../_libs/lucide-react.mjs";
import { i as InstallButton, s as useT } from "./router-By-l8WBZ.mjs";
import { t as OffxLockup } from "./logo-puPl-3SD.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/get-CIGTVplF.js
var import_jsx_runtime = require_jsx_runtime();
function GetApp() {
	const t = useT();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "min-h-dvh bg-bg px-5 py-12 text-fg",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto w-full max-w-md space-y-8",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OffxLockup, {}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[11px] font-medium uppercase tracking-[0.28em] text-muted",
						children: t("get.kicker")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "mt-2 font-display text-4xl tracking-[0.12em]",
						children: t("get.title")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-sm leading-relaxed text-muted",
						children: t("get.body")
					})
				] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-1 gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
						href: "/api/native?kind=exe",
						className: "flex h-14 items-center gap-3 rounded-xl bg-fg px-4 text-sm font-medium text-bg",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Monitor, { className: "size-5" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "flex-1 text-left",
								children: t("settings.dllWindows")
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "size-4" })
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
						href: "/api/native?kind=apk",
						className: "flex h-14 items-center gap-3 rounded-xl bg-surface px-4 text-sm font-medium shadow-[var(--shadow-border)]",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Smartphone, { className: "size-5" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "flex-1 text-left",
								children: t("settings.dllAndroid")
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "size-4" })
						]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InstallButton, {}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/login",
					className: "block text-center text-sm text-muted underline-offset-4 hover:underline",
					children: t("get.already")
				})
			]
		})
	});
}
//#endregion
export { GetApp as component };
