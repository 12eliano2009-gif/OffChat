import { o as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { C as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as GROK_PROVIDERS } from "./server-BhCAFEGt.mjs";
import { d as cn, u as Button } from "./router-By-l8WBZ.mjs";
import { r as signIn, t as authClient } from "./client-B40BzJxt.mjs";
import { t as Input } from "./input-CpxBPLku.mjs";
import { t as Label } from "./label-DUjhxCrZ.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/auth-form-cM0hRC4H.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function Separator({ className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: cn("h-px w-full bg-border", className),
		role: "separator"
	});
}
function ProviderIcon({ idp }) {
	if (idp === "google") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		viewBox: "0 0 24 24",
		className: "size-4",
		"aria-hidden": "true",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				fill: "currentColor",
				d: "M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				fill: "currentColor",
				d: "M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				fill: "currentColor",
				d: "M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				fill: "currentColor",
				d: "M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
			})
		]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
		viewBox: "0 0 24 24",
		className: "size-4",
		"aria-hidden": "true",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
			fill: "currentColor",
			d: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.74l7.727-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"
		})
	});
}
function AuthForm({ compact = false }) {
	const [mode, setMode] = (0, import_react.useState)("in");
	const [name, setName] = (0, import_react.useState)("");
	const [email, setEmail] = (0, import_react.useState)("");
	const [password, setPassword] = (0, import_react.useState)("");
	const [confirm, setConfirm] = (0, import_react.useState)("");
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)(null);
	async function onEmail(e) {
		e.preventDefault();
		setBusy(true);
		setError(null);
		try {
			if (mode === "up") {
				if (password !== confirm) throw new Error("Passwörter stimmen nicht überein.");
				const { error: err } = await authClient.signUp.email({
					email,
					password,
					name: name.trim() || email.split("@")[0] || "Offchat"
				});
				if (err) throw new Error(err.message || "Registrierung fehlgeschlagen.");
			} else {
				const { error: err } = await authClient.signIn.email({
					email,
					password
				});
				if (err) throw new Error(err.message || "Anmeldung fehlgeschlagen.");
			}
			await authClient.getSession();
			window.location.href = "/";
		} catch (err) {
			setError(err instanceof Error ? err.message : "Etwas ist schiefgelaufen.");
			setBusy(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "w-full space-y-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex flex-col gap-2",
				children: GROK_PROVIDERS.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					type: "button",
					variant: "secondary",
					className: "h-12 w-full rounded-lg",
					onClick: () => signIn(p.providerId, { callbackURL: "/" }),
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProviderIcon, { idp: p.idp }),
						"Weiter mit ",
						p.label
					]
				}, p.providerId))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Separator, { className: "flex-1" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-[11px] uppercase tracking-[0.18em] text-faint",
						children: "oder E-Mail"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Separator, { className: "flex-1" })
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				onSubmit: onEmail,
				className: "space-y-3",
				children: [
					mode === "up" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "offx-name",
							children: "Name"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							id: "offx-name",
							value: name,
							onChange: (e) => setName(e.target.value),
							autoComplete: "name",
							required: true
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "offx-email",
							children: "E-Mail"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							id: "offx-email",
							type: "email",
							value: email,
							onChange: (e) => setEmail(e.target.value),
							autoComplete: "email",
							required: true
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "offx-password",
							children: "Passwort"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							id: "offx-password",
							type: "password",
							value: password,
							onChange: (e) => setPassword(e.target.value),
							autoComplete: mode === "up" ? "new-password" : "current-password",
							minLength: 8,
							required: true
						})]
					}),
					mode === "up" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "offx-confirm",
							children: "Passwort bestätigen"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							id: "offx-confirm",
							type: "password",
							value: confirm,
							onChange: (e) => setConfirm(e.target.value),
							autoComplete: "new-password",
							minLength: 8,
							required: true
						})]
					}),
					error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-destructive",
						children: error
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "submit",
						className: "h-12 w-full rounded-lg",
						disabled: busy,
						children: busy ? "Bitte warten…" : mode === "up" ? "Konto erstellen" : "Mit E-Mail anmelden"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "w-full text-center text-sm text-muted",
				onClick: () => {
					setMode(mode === "up" ? "in" : "up");
					setError(null);
				},
				children: mode === "up" ? "Schon dabei? Anmelden" : "Neu hier? Konto erstellen"
			}),
			!compact && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-center text-xs text-faint",
				children: "10 NOX = 0,99 €. Beim Senden kommen 70 % an — 30 % gehen an Offchat. Die App selbst läuft im lokalen Netz."
			})
		]
	});
}
//#endregion
export { AuthForm as t };
