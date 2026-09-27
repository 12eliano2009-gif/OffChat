import { C as require_jsx_runtime, b as Navigate, y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { i as InstallButton } from "./router-By-l8WBZ.mjs";
import { t as OffxLockup } from "./logo-puPl-3SD.mjs";
import { r as useCurrentUserState, t as Skeleton } from "./skeleton-DPoB2_JI.mjs";
import { t as AuthForm } from "./auth-form-cM0hRC4H.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/login-Chq4IE2h.js
var import_jsx_runtime = require_jsx_runtime();
function Login() {
	const { user, isPending } = useCurrentUserState();
	if (isPending) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "grid min-h-dvh place-items-center bg-bg",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-12 w-40 rounded-lg" })
	});
	if (user) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigate, { to: "/" });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "grid min-h-dvh place-items-center bg-bg px-5 py-10",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "w-full max-w-sm space-y-6",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OffxLockup, {}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-xl font-medium",
					children: "Anmelden"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm text-muted",
					children: "Google oder E-Mail. Danach läuft Offchat im lokalen Netz — Café, WG, privates WLAN."
				})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuthForm, {}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InstallButton, {}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/get",
					className: "block text-center text-sm text-muted underline-offset-4 hover:underline",
					children: "App herunterladen"
				})
			]
		})
	});
}
//#endregion
export { Login as component };
