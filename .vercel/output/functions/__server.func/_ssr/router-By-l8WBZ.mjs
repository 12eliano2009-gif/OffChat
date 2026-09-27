import { o as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { C as require_jsx_runtime, S as useRouter, _ as createFileRoute, d as HeadContent, g as lazyRouteComponent, h as Outlet, m as createRouter, u as Scripts, v as createRootRoute } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as getServerFnById, i as TSS_SERVER_FUNCTION, r as createServerFn, s as __exportAll } from "./ssr.mjs";
import { B as string, H as unknown, I as number, L as object, M as discriminatedUnion, O as _enum, P as literal, V as union } from "../_libs/@better-auth/core+[...].mjs";
import { r as getSql } from "./db-DXXzCag8.mjs";
import { n as number$1 } from "../_libs/zod.mjs";
import { n as auth } from "./server-BhCAFEGt.mjs";
import { T as Download, a as TriangleAlert, d as Smartphone, f as Share, t as X, v as Monitor } from "../_libs/lucide-react.mjs";
import { t as Slot } from "../_libs/radix-ui__react-slot.mjs";
import { n as clsx, t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
import { t as Toaster } from "../_libs/sonner.mjs";
import { existsSync } from "node:fs";
import path from "node:path";
import { mkdtemp, readFile, unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
//#region node_modules/.nitro/vite/services/ssr/assets/router-By-l8WBZ.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var FALLBACK_MESSAGE = "Ein unerwarteter Fehler ist aufgetreten. Seite neu laden.";
function errorMessage(error) {
	if (error instanceof Error && error.message) return error.message;
	if (typeof error === "string" && error) return error;
	return FALLBACK_MESSAGE;
}
function AppErrorComponent({ error }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "flex min-h-screen flex-col items-center justify-center gap-3 bg-bg px-6 text-center text-fg",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-destructive",
				"aria-hidden": "true",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, {
					className: "size-10",
					strokeWidth: 2
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-lg font-semibold",
				children: "Etwas ist schiefgelaufen"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "max-w-md text-sm break-words text-muted",
				children: errorMessage(error)
			})
		]
	});
}
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
/**
* App-wide client provider mounted once near the root (in `src/routes/__root.tsx`):
*
*   <AuthProvider><Outlet /></AuthProvider>
*
* Better Auth's React client (`@/lib/auth/client`) needs NO context provider —
* its `useSession()` works standalone — so this is a passthrough today. It's
* kept as the single, stable mount point for any future client-side providers
* (e.g. a toast or theme provider) without churning the root shell.
*/
function AuthProvider({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children });
}
var CONNECTOR_TOKEN_READY_EVENT = "grok:connector-token-ready";
function isGrokEmbedderOrigin(origin) {
	try {
		const url = new URL(origin);
		if (url.protocol !== "https:" && url.protocol !== "http:") return false;
		const host = url.hostname.toLowerCase();
		if (host === "grok.com" || host.endsWith(".grok.com")) return true;
		if (host === "localhost" || host === "127.0.0.1" || host === "[::1]") return true;
		return false;
	} catch {
		return false;
	}
}
function isSandboxPreviewGuestHost(hostname) {
	const host = hostname.toLowerCase();
	return host === "grok-sandbox.com" || host.endsWith(".grok-sandbox.com");
}
function isRemintPreviewPair(guestHost, parentHost) {
	const guest = guestHost.toLowerCase();
	const parent = parentHost.toLowerCase();
	const i = guest.indexOf(".preview.");
	if (i <= 0) return false;
	const label = guest.slice(0, i);
	const rest = guest.slice(i + 9);
	if (label.includes(".") || !rest.includes(".")) return false;
	return parent === rest || parent === `grok.${rest}`;
}
function resolveParentEmbedderOrigin(parentIsSelf, referrer, ancestorOrigin, guestHostname = "") {
	if (parentIsSelf) return null;
	for (const candidate of [referrer, ancestorOrigin ?? ""].filter(Boolean)) try {
		const url = new URL(candidate.includes("://") ? candidate : `https://${candidate}`);
		if (url.protocol !== "https:" && url.protocol !== "http:") continue;
		if (isGrokEmbedderOrigin(url.origin)) return url.origin;
		if (isSandboxPreviewGuestHost(guestHostname) || isRemintPreviewPair(guestHostname, url.hostname)) return url.origin;
	} catch {}
	return null;
}
/**
* Guest side of the grok-web ↔ sandbox preview postMessage bridge.
*
* Activates only when this page is framed by an allowlisted Grok embedder.
* Top-level runs (download/export, local `npm run dev`, deployed sites) noop.
*/
var PREVIEW_BRIDGE_CHANNEL = "grok-preview-bridge";
var EnvelopeSchema = object({
	channel: literal(PREVIEW_BRIDGE_CHANNEL),
	version: number().int().positive(),
	type: string().min(1)
});
var HelloSchema = EnvelopeSchema.extend({ type: literal("hello") });
var NavigateSchema = EnvelopeSchema.extend({
	type: literal("navigate"),
	path: string().min(1)
});
var HistorySchema = EnvelopeSchema.extend({
	type: literal("history"),
	delta: union([literal(-1), literal(1)])
});
var ConnectorTokenReadySchema = EnvelopeSchema.extend({ type: literal("connector-token-ready") });
function isSafeBridgePath(path) {
	if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) return false;
	try {
		return new URL(path, "https://preview.invalid").origin === "https://preview.invalid";
	} catch {
		return false;
	}
}
/**
* Origin of the Grok embedder framing this page, or null when the page runs
* top-level (download/export, local `npm run dev`, deployed sites) or under a
* non-Grok parent. Client-only; null during SSR.
*/
function resolveCurrentEmbedderOrigin() {
	if (typeof window === "undefined") return null;
	const ancestorOrigin = typeof location.ancestorOrigins !== "undefined" && location.ancestorOrigins.length > 0 ? location.ancestorOrigins[0] : null;
	return resolveParentEmbedderOrigin(window.parent === window, document.referrer, ancestorOrigin, window.location.hostname);
}
/**
* Install host↔guest messaging. Returns a dispose function.
* Noops (returns a no-op dispose) when not embedded under a Grok parent.
*/
function installPreviewHostBridge(options = {}) {
	const parentOrigin = resolveCurrentEmbedderOrigin();
	if (parentOrigin === null) return () => {};
	const ROOT_STATE_KEY = "__grokPreviewBridgeRoot";
	const originalPushState = window.history.pushState.bind(window.history);
	const originalReplaceState = window.history.replaceState.bind(window.history);
	const isAtHistoryRoot = () => {
		const state = window.history.state;
		return Boolean(state && typeof state === "object" && state[ROOT_STATE_KEY] === true);
	};
	try {
		const current = window.history.state;
		if (!(current !== null && typeof current === "object" && Object.prototype.hasOwnProperty.call(current, ROOT_STATE_KEY))) {
			const isRoot = window.history.length <= 1;
			originalReplaceState(current && typeof current === "object" ? {
				...current,
				[ROOT_STATE_KEY]: isRoot
			} : { [ROOT_STATE_KEY]: isRoot }, "", window.location.href);
		}
	} catch {}
	const post = (message) => {
		window.parent.postMessage(message, parentOrigin);
	};
	const reportLocation = () => {
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "location",
			path: window.location.pathname || "/",
			search: window.location.search,
			hash: window.location.hash
		});
	};
	const reportRoutes = () => {
		const paths = options.getRoutePaths?.() ?? [];
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "routes",
			paths
		});
	};
	const defaultNavigate = (path) => {
		if (!isSafeBridgePath(path)) return;
		try {
			const url = new URL(path, window.location.origin);
			if (url.origin !== window.location.origin) return;
			const next = `${url.pathname}${url.search}${url.hash}`;
			window.history.pushState(window.history.state, "", next);
			window.dispatchEvent(new PopStateEvent("popstate", { state: window.history.state }));
		} catch {}
	};
	const navigate = (path) => {
		if (!isSafeBridgePath(path)) return;
		if (options.navigate) {
			options.navigate(path);
			return;
		}
		defaultNavigate(path);
	};
	const announce = () => {
		reportLocation();
		reportRoutes();
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "ready"
		});
	};
	const onHello = (data) => {
		if (!HelloSchema.safeParse(data).success) return;
		announce();
	};
	const onNavigate = (data) => {
		const parsed = NavigateSchema.safeParse(data);
		if (!parsed.success) return;
		navigate(parsed.data.path);
		queueMicrotask(reportLocation);
	};
	const onHistory = (data) => {
		const parsed = HistorySchema.safeParse(data);
		if (!parsed.success) return;
		if (parsed.data.delta === -1 && isAtHistoryRoot()) return;
		window.history.go(parsed.data.delta);
	};
	const onConnectorTokenReady = (data) => {
		if (!ConnectorTokenReadySchema.safeParse(data).success) return;
		window.dispatchEvent(new Event(CONNECTOR_TOKEN_READY_EVENT));
	};
	const hostMessageHandlers = /* @__PURE__ */ new Map([
		["hello", onHello],
		["navigate", onNavigate],
		["history", onHistory],
		["connector-token-ready", onConnectorTokenReady]
	]);
	const onMessage = (event) => {
		if (event.source !== window.parent) return;
		if (event.origin !== parentOrigin) return;
		const envelope = EnvelopeSchema.safeParse(event.data);
		if (!envelope.success || envelope.data.version !== 1) return;
		hostMessageHandlers.get(envelope.data.type)?.(event.data);
	};
	const onPopState = () => {
		reportLocation();
	};
	const onHashChange = () => {
		reportLocation();
	};
	window.history.pushState = (data, unused, url) => {
		const next = data && typeof data === "object" ? {
			...data,
			[ROOT_STATE_KEY]: false
		} : data;
		originalPushState(next, unused, url);
		reportLocation();
	};
	window.history.replaceState = (data, unused, url) => {
		const next = isAtHistoryRoot() ? {
			...data && typeof data === "object" ? data : {},
			[ROOT_STATE_KEY]: true
		} : data;
		originalReplaceState(next, unused, url);
		reportLocation();
	};
	window.addEventListener("message", onMessage);
	window.addEventListener("popstate", onPopState);
	window.addEventListener("hashchange", onHashChange);
	announce();
	return () => {
		window.removeEventListener("message", onMessage);
		window.removeEventListener("popstate", onPopState);
		window.removeEventListener("hashchange", onHashChange);
		window.history.pushState = originalPushState;
		window.history.replaceState = originalReplaceState;
	};
}
/** Collect static path patterns from a TanStack route tree (best-effort). */
function collectRoutePathsFromTree(routeTree) {
	const paths = /* @__PURE__ */ new Set();
	const walk = (node) => {
		if (!node || typeof node !== "object") return;
		const record = node;
		const full = typeof record.fullPath === "string" ? record.fullPath : typeof record.path === "string" ? record.path : null;
		if (full !== null && full !== "") paths.add(full.startsWith("/") ? full : `/${full}`);
		else if (full === "") paths.add("/");
		const children = record.children;
		if (Array.isArray(children)) for (const child of children) walk(child);
		else if (children && typeof children === "object") for (const child of Object.values(children)) walk(child);
	};
	walk(routeTree);
	return [...paths];
}
/**
* Mount once in `__root.tsx` so the Grok preview chrome can drive navigation
* (and later receive registered routes). Noops when the app is not embedded.
*/
function PreviewHostBridge() {
	const router = useRouter();
	(0, import_react.useEffect)(() => {
		return installPreviewHostBridge({
			navigate: (path) => {
				router.history.push(path);
			},
			getRoutePaths: () => collectRoutePathsFromTree(router.routeTree)
		});
	}, [router]);
	return null;
}
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
var buttonVariants = cva("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors transition-transform duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.96]", {
	variants: {
		variant: {
			default: "bg-primary text-primary-foreground hover:bg-primary/90",
			secondary: "bg-secondary text-secondary-foreground hover:bg-elevated",
			ghost: "text-fg hover:bg-elevated",
			outline: "border border-border bg-transparent hover:bg-elevated",
			destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90"
		},
		size: {
			default: "h-11 px-4",
			sm: "h-9 rounded-sm px-3 text-xs",
			lg: "h-12 px-5",
			icon: "size-11"
		}
	},
	defaultVariants: {
		variant: "default",
		size: "default"
	}
});
function Button({ className, variant, size, asChild = false, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(asChild ? Slot : "button", {
		className: cn(buttonVariants({
			variant,
			size
		}), className),
		...props
	});
}
var LOCALES = [
	"de",
	"en",
	"es",
	"ru",
	"zh"
];
var LOCALE_META = {
	de: {
		native: "Deutsch",
		short: "DE"
	},
	en: {
		native: "English",
		short: "EN"
	},
	es: {
		native: "Español",
		short: "ES"
	},
	ru: {
		native: "Русский",
		short: "RU"
	},
	zh: {
		native: "中文",
		short: "中文"
	}
};
var de = {
	"nav.feed": "Für dich",
	"nav.chats": "Chats",
	"nav.new": "Neu",
	"nav.online": "Online",
	"nav.profile": "Profil",
	"nav.settings": "Einstellungen",
	"lan.local": "Lokales Netz",
	"lan.online": "Online",
	"lan.bluetooth": "Bluetooth",
	"lan.onlyYou": "nur du",
	"lan.here": "{n} hier",
	"lan.searching": "sucht…",
	"lan.waiting": "warte auf Geräte",
	"lan.noWifi": "Kein WLAN",
	"lan.room": "Raum {code}",
	"lan.bt": "BT {code}",
	"settings.title": "Einstellungen",
	"settings.appearance": "Darstellung",
	"settings.dark": "Dunkel",
	"settings.light": "Hell",
	"settings.mode": "Verbindung",
	"settings.modeLocal": "Offline · WLAN",
	"settings.modeLocalHint": "Nur Geräte im selben lokalen Netz. Kein Internet nötig.",
	"settings.modeOnline": "Online · Code",
	"settings.modeOnlineHint": "Gleicher 4-Zeichen-Code auf allen Geräten — auch über das Internet.",
	"settings.modeBt": "Bluetooth",
	"settings.modeBtHint": "Lokal ohne WLAN. Gleichen Code setzen, Bluetooth an, optional Tethering.",
	"settings.language": "Sprache",
	"settings.downloads": "App herunterladen",
	"settings.dllWindows": "Windows · EXE",
	"settings.dllAndroid": "Android · APK",
	"settings.dllPwa": "Als App installieren",
	"settings.dllWindowsHint": "OFFCHAT.exe — öffnet die App im eigenen Fenster (Edge oder Chrome).",
	"settings.dllAndroidHint": "OFFCHAT.apk — sideloaden, Quelle unbekannt erlauben.",
	"settings.code": "Gemeinsamer Code",
	"settings.codeApply": "Setzen",
	"settings.codeMake": "Code erzeugen",
	"settings.btScan": "Gerät suchen",
	"settings.btScanning": "Suche…",
	"settings.btUnavailable": "Bluetooth im Browser nicht verfügbar. Code reicht.",
	"settings.btFound": "Gefunden: {name}",
	"settings.active": "Aktiv",
	"install.cta": "App installieren",
	"install.ios": "Auf iPhone sichern",
	"install.done": "Offchat ist auf diesem Gerät installiert.",
	"install.title": "OFFCHAT AUF DEM GERÄT",
	"install.body": "Kein Store. Direkt aus dem Browser auf den Home-Bildschirm — oder EXE / APK laden.",
	"install.stepIos": "In Safari öffnen → Teilen → „Zum Home-Bildschirm“.",
	"install.stepAndroid": "Chrome: Menü ⋮ → „App installieren“, oder die APK.",
	"install.stepDesktop": "Chrome/Edge: Install-Symbol — oder die Windows-EXE.",
	"get.kicker": "Von der Website aufs Gerät",
	"get.title": "OFFCHAT HOLEN",
	"get.body": "Als App auf PC und Android, oder direkt aus dem Browser. Danach Feed, Chat und Posts im lokalen Netz.",
	"get.already": "Schon installiert? Anmelden",
	"landing.kicker": "Lokales soziales Netz",
	"landing.body": "Social Media fürs WLAN vor Ort — öffentlich oder privat. Feed, Chat und Posts bleiben zwischen den Geräten hier. Ein Tab geht ins Internet: NOX holen.",
	"landing.how": "So kommt Offchat aufs Gerät",
	"landing.signin": "Anmelden",
	"composer.placeholder": "Nachricht",
	"composer.send": "Senden",
	"composer.image": "Bild senden",
	"composer.emoji": "Emoji",
	"composer.pay": "NOX senden",
	"create.title": "Neuer Beitrag",
	"create.hint": "Geht an alle mit Offchat in {net} — ohne den Online-Tab.",
	"create.caption": "Bildunterschrift",
	"create.share": "Teilen im Netz",
	"create.pick": "Foto oder Video wählen",
	"create.posted": "Im lokalen Netz gepostet.",
	"profile.edit": "Profil bearbeiten",
	"profile.save": "Speichern",
	"profile.cancel": "Abbrechen",
	"profile.message": "Nachricht",
	"profile.settings": "Einstellungen",
	"profile.bio": "Noch keine Bio.",
	"profile.posts": "{n} Beiträge in diesem Netz",
	"profile.postsOne": "1 Beitrag in diesem Netz",
	"profile.none": "Noch keine Beiträge.",
	"common.cancel": "Abbrechen",
	"common.close": "Schließen",
	"common.delete": "Löschen",
	"common.save": "Speichern",
	"feed.emptyTitle": "Hier im Netz",
	"feed.searching": "Suche Leute…",
	"feed.nobody": "Noch niemand sonst hier.",
	"feed.comment": "Kommentieren…",
	"feed.comments": "Alle {n} Kommentare",
	"feed.noComments": "Noch keine Kommentare.",
	"feed.delete": "Löschen",
	"feed.deleteQ": "Beitrag löschen?",
	"online.kicker": "Der eine Tab mit Internet",
	"online.title": "ONLINE",
	"online.body": "Für dich, Chats und Posts laufen im lokalen Netz. Hier holst du NOX — und setzt den Raum-Code.",
	"online.net": "Lokales Netz",
	"online.web": "Internet",
	"online.on": "An",
	"online.off": "Aus",
	"online.nox": "NOX holen möglich",
	"online.localOnly": "Nur lokales Netz",
	"online.room": "Gemeinsamer Raum",
	"online.roomHint": "Gleichen Code auf allen Geräten — dann kommen Chat, Likes und Posts an.",
	"online.auto": "Auto",
	"online.make": "Code erzeugen",
	"online.set": "Setzen"
};
var DICTS = {
	de,
	en: {
		"nav.feed": "For you",
		"nav.chats": "Chats",
		"nav.new": "New",
		"nav.online": "Online",
		"nav.profile": "Profile",
		"nav.settings": "Settings",
		"lan.local": "Local network",
		"lan.online": "Online",
		"lan.bluetooth": "Bluetooth",
		"lan.onlyYou": "just you",
		"lan.here": "{n} here",
		"lan.searching": "searching…",
		"lan.waiting": "waiting for devices",
		"lan.noWifi": "No Wi-Fi",
		"lan.room": "Room {code}",
		"lan.bt": "BT {code}",
		"settings.title": "Settings",
		"settings.appearance": "Appearance",
		"settings.dark": "Dark",
		"settings.light": "Light",
		"settings.mode": "Connection",
		"settings.modeLocal": "Offline · Wi-Fi",
		"settings.modeLocalHint": "Only devices on this local network. No internet needed.",
		"settings.modeOnline": "Online · Code",
		"settings.modeOnlineHint": "Same 4-character code on every device — works across the internet.",
		"settings.modeBt": "Bluetooth",
		"settings.modeBtHint": "Local without Wi-Fi. Same code, Bluetooth on, optional tethering.",
		"settings.language": "Language",
		"settings.downloads": "Download the app",
		"settings.dllWindows": "Windows · EXE",
		"settings.dllAndroid": "Android · APK",
		"settings.dllPwa": "Install as app",
		"settings.dllWindowsHint": "OFFCHAT.exe — opens in its own window (Edge or Chrome).",
		"settings.dllAndroidHint": "OFFCHAT.apk — sideload and allow unknown sources.",
		"settings.code": "Shared code",
		"settings.codeApply": "Set",
		"settings.codeMake": "Generate code",
		"settings.btScan": "Find device",
		"settings.btScanning": "Searching…",
		"settings.btUnavailable": "Bluetooth isn’t available in this browser. The code is enough.",
		"settings.btFound": "Found: {name}",
		"settings.active": "On",
		"install.cta": "Install app",
		"install.ios": "Save to iPhone",
		"install.done": "Offchat is installed on this device.",
		"install.title": "OFFCHAT ON YOUR DEVICE",
		"install.body": "No store. Home screen from the browser — or download the EXE / APK.",
		"install.stepIos": "Open in Safari → Share → “Add to Home Screen”.",
		"install.stepAndroid": "Chrome: menu ⋮ → “Install app”, or use the APK.",
		"install.stepDesktop": "Chrome/Edge: install icon — or the Windows EXE.",
		"get.kicker": "From the site onto your device",
		"get.title": "GET OFFCHAT",
		"get.body": "As an app on PC and Android, or straight from the browser. Then feed, chat and posts stay on the local network.",
		"get.already": "Already installed? Sign in",
		"landing.kicker": "Local social network",
		"landing.body": "Social media for the Wi-Fi you’re on — public or private. Feed, chat and posts stay between the devices here. One tab goes online: buy NOX.",
		"landing.how": "How to get Offchat on a device",
		"landing.signin": "Sign in",
		"composer.placeholder": "Message",
		"composer.send": "Send",
		"composer.image": "Send image",
		"composer.emoji": "Emoji",
		"composer.pay": "Send NOX",
		"create.title": "New post",
		"create.hint": "Goes to everyone with Offchat on {net} — no Online tab needed.",
		"create.caption": "Caption",
		"create.share": "Share on the network",
		"create.pick": "Choose photo or video",
		"create.posted": "Posted on the local network.",
		"profile.edit": "Edit profile",
		"profile.save": "Save",
		"profile.cancel": "Cancel",
		"profile.message": "Message",
		"profile.settings": "Settings",
		"profile.bio": "No bio yet.",
		"profile.posts": "{n} posts on this network",
		"profile.postsOne": "1 post on this network",
		"profile.none": "No posts yet.",
		"common.cancel": "Cancel",
		"common.close": "Close",
		"common.delete": "Delete",
		"common.save": "Save",
		"feed.emptyTitle": "Here on the network",
		"feed.searching": "Looking for people…",
		"feed.nobody": "Nobody else here yet.",
		"feed.comment": "Comment…",
		"feed.comments": "All {n} comments",
		"feed.noComments": "No comments yet.",
		"feed.delete": "Delete",
		"feed.deleteQ": "Delete this post?",
		"online.kicker": "The one tab with internet",
		"online.title": "ONLINE",
		"online.body": "Feed, chats and posts run on the local network. Here you buy NOX — and set the room code.",
		"online.net": "Local network",
		"online.web": "Internet",
		"online.on": "On",
		"online.off": "Off",
		"online.nox": "You can buy NOX",
		"online.localOnly": "Local network only",
		"online.room": "Shared room",
		"online.roomHint": "Same code on every device — then chat, likes and posts arrive.",
		"online.auto": "Auto",
		"online.make": "Generate code",
		"online.set": "Set"
	},
	es: {
		"nav.feed": "Para ti",
		"nav.chats": "Chats",
		"nav.new": "Nuevo",
		"nav.online": "En línea",
		"nav.profile": "Perfil",
		"nav.settings": "Ajustes",
		"lan.local": "Red local",
		"lan.online": "En línea",
		"lan.bluetooth": "Bluetooth",
		"lan.onlyYou": "solo tú",
		"lan.here": "{n} aquí",
		"lan.searching": "buscando…",
		"lan.waiting": "esperando dispositivos",
		"lan.noWifi": "Sin Wi-Fi",
		"lan.room": "Sala {code}",
		"lan.bt": "BT {code}",
		"settings.title": "Ajustes",
		"settings.appearance": "Apariencia",
		"settings.dark": "Oscuro",
		"settings.light": "Claro",
		"settings.mode": "Conexión",
		"settings.modeLocal": "Offline · Wi-Fi",
		"settings.modeLocalHint": "Solo dispositivos en esta red local. Sin internet.",
		"settings.modeOnline": "En línea · Código",
		"settings.modeOnlineHint": "El mismo código de 4 caracteres en cada dispositivo, también por internet.",
		"settings.modeBt": "Bluetooth",
		"settings.modeBtHint": "Local sin Wi-Fi. Mismo código, Bluetooth activado, tethering opcional.",
		"settings.language": "Idioma",
		"settings.downloads": "Descargar la app",
		"settings.dllWindows": "Windows · EXE",
		"settings.dllAndroid": "Android · APK",
		"settings.dllPwa": "Instalar como app",
		"settings.dllWindowsHint": "OFFCHAT.exe — se abre en su propia ventana (Edge o Chrome).",
		"settings.dllAndroidHint": "OFFCHAT.apk — instalar y permitir orígenes desconocidos.",
		"settings.code": "Código compartido",
		"settings.codeApply": "Usar",
		"settings.codeMake": "Crear código",
		"settings.btScan": "Buscar dispositivo",
		"settings.btScanning": "Buscando…",
		"settings.btUnavailable": "Bluetooth no está disponible en este navegador. El código basta.",
		"settings.btFound": "Encontrado: {name}",
		"settings.active": "Activo",
		"install.cta": "Instalar app",
		"install.ios": "Guardar en iPhone",
		"install.done": "Offchat está instalado en este dispositivo.",
		"install.title": "OFFCHAT EN EL DISPOSITIVO",
		"install.body": "Sin tienda. A la pantalla de inicio desde el navegador — o descarga EXE / APK.",
		"install.stepIos": "En Safari → Compartir → “Añadir a pantalla de inicio”.",
		"install.stepAndroid": "Chrome: menú ⋮ → “Instalar app”, o usa el APK.",
		"install.stepDesktop": "Chrome/Edge: icono de instalar — o el EXE de Windows.",
		"get.kicker": "De la web al dispositivo",
		"get.title": "OBTENER OFFCHAT",
		"get.body": "Como app en PC y Android, o desde el navegador. Luego el feed, el chat y las publicaciones se quedan en la red local.",
		"get.already": "¿Ya instalado? Entrar",
		"landing.kicker": "Red social local",
		"landing.body": "Red social para el Wi-Fi en el que estás. Feed, chat y publicaciones entre estos dispositivos. Una pestaña sale a internet: comprar NOX.",
		"landing.how": "Cómo poner Offchat en el dispositivo",
		"landing.signin": "Entrar",
		"composer.placeholder": "Mensaje",
		"composer.send": "Enviar",
		"composer.image": "Enviar imagen",
		"composer.emoji": "Emoji",
		"composer.pay": "Enviar NOX",
		"create.title": "Nueva publicación",
		"create.hint": "Llega a todos con Offchat en {net}.",
		"create.caption": "Descripción",
		"create.share": "Compartir en la red",
		"create.pick": "Elegir foto o vídeo",
		"create.posted": "Publicado en la red local.",
		"profile.edit": "Editar perfil",
		"profile.save": "Guardar",
		"profile.cancel": "Cancelar",
		"profile.message": "Mensaje",
		"profile.settings": "Ajustes",
		"profile.bio": "Sin bio todavía.",
		"profile.posts": "{n} publicaciones en esta red",
		"profile.postsOne": "1 publicación en esta red",
		"profile.none": "Aún no hay publicaciones.",
		"common.cancel": "Cancelar",
		"common.close": "Cerrar",
		"common.delete": "Eliminar",
		"common.save": "Guardar",
		"feed.emptyTitle": "Aquí en la red",
		"feed.searching": "Buscando gente…",
		"feed.nobody": "Nadie más aquí todavía.",
		"feed.comment": "Comentar…",
		"feed.comments": "Los {n} comentarios",
		"feed.noComments": "Aún no hay comentarios.",
		"feed.delete": "Eliminar",
		"feed.deleteQ": "¿Eliminar esta publicación?",
		"online.kicker": "La única pestaña con internet",
		"online.title": "EN LÍNEA",
		"online.body": "El feed, los chats y las publicaciones van por la red local. Aquí compras NOX y pones el código.",
		"online.net": "Red local",
		"online.web": "Internet",
		"online.on": "On",
		"online.off": "Off",
		"online.nox": "Puedes comprar NOX",
		"online.localOnly": "Solo red local",
		"online.room": "Sala compartida",
		"online.roomHint": "El mismo código en cada dispositivo: entonces llegan chat, likes y posts.",
		"online.auto": "Auto",
		"online.make": "Crear código",
		"online.set": "Usar"
	},
	ru: {
		"nav.feed": "Лента",
		"nav.chats": "Чаты",
		"nav.new": "Новое",
		"nav.online": "Онлайн",
		"nav.profile": "Профиль",
		"nav.settings": "Настройки",
		"lan.local": "Локальная сеть",
		"lan.online": "Онлайн",
		"lan.bluetooth": "Bluetooth",
		"lan.onlyYou": "только ты",
		"lan.here": "{n} здесь",
		"lan.searching": "поиск…",
		"lan.waiting": "ждём устройства",
		"lan.noWifi": "Нет Wi-Fi",
		"lan.room": "Комната {code}",
		"lan.bt": "BT {code}",
		"settings.title": "Настройки",
		"settings.appearance": "Оформление",
		"settings.dark": "Тёмная",
		"settings.light": "Светлая",
		"settings.mode": "Подключение",
		"settings.modeLocal": "Офлайн · Wi-Fi",
		"settings.modeLocalHint": "Только устройства в этой локальной сети. Интернет не нужен.",
		"settings.modeOnline": "Онлайн · Код",
		"settings.modeOnlineHint": "Одинаковый код из 4 символов на всех устройствах — и через интернет.",
		"settings.modeBt": "Bluetooth",
		"settings.modeBtHint": "Локально без Wi-Fi. Тот же код, Bluetooth включён, раздача по желанию.",
		"settings.language": "Язык",
		"settings.downloads": "Скачать приложение",
		"settings.dllWindows": "Windows · EXE",
		"settings.dllAndroid": "Android · APK",
		"settings.dllPwa": "Установить как приложение",
		"settings.dllWindowsHint": "OFFCHAT.exe — своё окно (Edge или Chrome).",
		"settings.dllAndroidHint": "OFFCHAT.apk — установка из неизвестных источников.",
		"settings.code": "Общий код",
		"settings.codeApply": "Задать",
		"settings.codeMake": "Создать код",
		"settings.btScan": "Найти устройство",
		"settings.btScanning": "Поиск…",
		"settings.btUnavailable": "Bluetooth в этом браузере недоступен. Кода достаточно.",
		"settings.btFound": "Найдено: {name}",
		"settings.active": "Вкл",
		"install.cta": "Установить",
		"install.ios": "На iPhone",
		"install.done": "Offchat установлен на этом устройстве.",
		"install.title": "OFFCHAT НА УСТРОЙСТВЕ",
		"install.body": "Без магазина. С домашнего экрана или EXE / APK.",
		"install.stepIos": "Safari → Поделиться → «На экран Домой».",
		"install.stepAndroid": "Chrome: меню ⋮ → «Установить», или APK.",
		"install.stepDesktop": "Chrome/Edge: значок установки — или EXE.",
		"get.kicker": "С сайта на устройство",
		"get.title": "СКАЧАТЬ OFFCHAT",
		"get.body": "Как приложение на ПК и Android или из браузера. Лента, чат и посты остаются в локальной сети.",
		"get.already": "Уже установлено? Войти",
		"landing.kicker": "Локальная соцсеть",
		"landing.body": "Соцсеть для этого Wi-Fi. Лента, чат и посты между устройствами здесь. Одна вкладка в интернет: купить NOX.",
		"landing.how": "Как поставить Offchat",
		"landing.signin": "Войти",
		"composer.placeholder": "Сообщение",
		"composer.send": "Отправить",
		"composer.image": "Отправить фото",
		"composer.emoji": "Эмодзи",
		"composer.pay": "Отправить NOX",
		"create.title": "Новый пост",
		"create.hint": "Увидят все с Offchat в {net}.",
		"create.caption": "Подпись",
		"create.share": "Опубликовать",
		"create.pick": "Фото или видео",
		"create.posted": "Опубликовано в локальной сети.",
		"profile.edit": "Редактировать",
		"profile.save": "Сохранить",
		"profile.cancel": "Отмена",
		"profile.message": "Написать",
		"profile.settings": "Настройки",
		"profile.bio": "Пока нет описания.",
		"profile.posts": "{n} постов в этой сети",
		"profile.postsOne": "1 пост в этой сети",
		"profile.none": "Пока нет постов.",
		"common.cancel": "Отмена",
		"common.close": "Закрыть",
		"common.delete": "Удалить",
		"common.save": "Сохранить",
		"feed.emptyTitle": "Здесь в сети",
		"feed.searching": "Ищем людей…",
		"feed.nobody": "Пока никого больше нет.",
		"feed.comment": "Комментарий…",
		"feed.comments": "Все {n} комментариев",
		"feed.noComments": "Пока нет комментариев.",
		"feed.delete": "Удалить",
		"feed.deleteQ": "Удалить пост?",
		"online.kicker": "Единственная вкладка с интернетом",
		"online.title": "ОНЛАЙН",
		"online.body": "Лента и чаты идут по локальной сети. Здесь покупаешь NOX и задаёшь код комнаты.",
		"online.net": "Локальная сеть",
		"online.web": "Интернет",
		"online.on": "Вкл",
		"online.off": "Выкл",
		"online.nox": "Можно купить NOX",
		"online.localOnly": "Только локальная сеть",
		"online.room": "Общая комната",
		"online.roomHint": "Одинаковый код на всех устройствах — тогда доходят чат, лайки и посты.",
		"online.auto": "Авто",
		"online.make": "Создать код",
		"online.set": "Задать"
	},
	zh: {
		"nav.feed": "推荐",
		"nav.chats": "聊天",
		"nav.new": "发布",
		"nav.online": "在线",
		"nav.profile": "我的",
		"nav.settings": "设置",
		"lan.local": "本地网络",
		"lan.online": "在线",
		"lan.bluetooth": "蓝牙",
		"lan.onlyYou": "只有你",
		"lan.here": "{n} 人在此",
		"lan.searching": "搜索中…",
		"lan.waiting": "等待设备",
		"lan.noWifi": "无 Wi-Fi",
		"lan.room": "房间 {code}",
		"lan.bt": "BT {code}",
		"settings.title": "设置",
		"settings.appearance": "外观",
		"settings.dark": "深色",
		"settings.light": "浅色",
		"settings.mode": "连接",
		"settings.modeLocal": "离线 · 局域网",
		"settings.modeLocalHint": "仅限同一本地网络中的设备，无需互联网。",
		"settings.modeOnline": "在线 · 代码",
		"settings.modeOnlineHint": "所有设备使用相同的 4 位代码，也可通过互联网。",
		"settings.modeBt": "蓝牙",
		"settings.modeBtHint": "不用 Wi-Fi。同一代码，打开蓝牙，可选热点共享。",
		"settings.language": "语言",
		"settings.downloads": "下载应用",
		"settings.dllWindows": "Windows · EXE",
		"settings.dllAndroid": "Android · APK",
		"settings.dllPwa": "安装为应用",
		"settings.dllWindowsHint": "OFFCHAT.exe — 独立窗口（Edge 或 Chrome）。",
		"settings.dllAndroidHint": "OFFCHAT.apk — 允许未知来源后安装。",
		"settings.code": "共享代码",
		"settings.codeApply": "设置",
		"settings.codeMake": "生成代码",
		"settings.btScan": "查找设备",
		"settings.btScanning": "正在搜索…",
		"settings.btUnavailable": "此浏览器不支持蓝牙。使用代码即可。",
		"settings.btFound": "已找到：{name}",
		"settings.active": "已开启",
		"install.cta": "安装应用",
		"install.ios": "添加到 iPhone",
		"install.done": "已在此设备安装 Offchat。",
		"install.title": "安装 OFFCHAT",
		"install.body": "无需应用商店。从浏览器添加到主屏幕，或下载 EXE / APK。",
		"install.stepIos": "在 Safari 中打开 → 分享 → “添加到主屏幕”。",
		"install.stepAndroid": "Chrome：菜单 ⋮ → “安装应用”，或使用 APK。",
		"install.stepDesktop": "Chrome/Edge：安装图标，或 Windows EXE。",
		"get.kicker": "从网站装到设备",
		"get.title": "获取 OFFCHAT",
		"get.body": "电脑和安卓可下载应用，也可直接用浏览器。动态、聊天和帖子留在本地网络。",
		"get.already": "已经安装？登录",
		"landing.kicker": "本地社交网络",
		"landing.body": "面向当前 Wi-Fi 的社交。动态、聊天和帖子只在这里的设备之间。只有一个标签页联网：购买 NOX。",
		"landing.how": "如何把 Offchat 装到设备",
		"landing.signin": "登录",
		"composer.placeholder": "发消息",
		"composer.send": "发送",
		"composer.image": "发送图片",
		"composer.emoji": "表情",
		"composer.pay": "发送 NOX",
		"create.title": "新帖子",
		"create.hint": "发送给 {net} 里所有使用 Offchat 的人。",
		"create.caption": "说明",
		"create.share": "发布到网络",
		"create.pick": "选择照片或视频",
		"create.posted": "已发布到本地网络。",
		"profile.edit": "编辑资料",
		"profile.save": "保存",
		"profile.cancel": "取消",
		"profile.message": "发消息",
		"profile.settings": "设置",
		"profile.bio": "还没有简介。",
		"profile.posts": "本网络有 {n} 篇帖子",
		"profile.postsOne": "本网络有 1 篇帖子",
		"profile.none": "还没有帖子。",
		"common.cancel": "取消",
		"common.close": "关闭",
		"common.delete": "删除",
		"common.save": "保存",
		"feed.emptyTitle": "就在这个网络",
		"feed.searching": "正在寻找附近的人…",
		"feed.nobody": "这里还没有其他人。",
		"feed.comment": "评论…",
		"feed.comments": "全部 {n} 条评论",
		"feed.noComments": "还没有评论。",
		"feed.delete": "删除",
		"feed.deleteQ": "删除这篇帖子？",
		"online.kicker": "唯一需要联网的标签",
		"online.title": "在线",
		"online.body": "动态和聊天走本地网络。这里购买 NOX，并设置房间代码。",
		"online.net": "本地网络",
		"online.web": "互联网",
		"online.on": "开",
		"online.off": "关",
		"online.nox": "可以购买 NOX",
		"online.localOnly": "仅本地网络",
		"online.room": "共享房间",
		"online.roomHint": "每台设备使用相同代码，聊天、点赞和帖子才会送达。",
		"online.auto": "自动",
		"online.make": "生成代码",
		"online.set": "设置"
	}
};
function translate(locale, key, vars) {
	let out = (DICTS[locale] ?? de)[key] ?? de[key] ?? key;
	if (vars) for (const [k, v] of Object.entries(vars)) out = out.replaceAll(`{${k}}`, String(v));
	return out;
}
var STORAGE = "offchat-settings";
var defaults = {
	theme: "dark",
	locale: "de",
	mode: "local"
};
function readStored() {
	if (typeof localStorage === "undefined") return defaults;
	try {
		const raw = localStorage.getItem(STORAGE);
		if (!raw) return defaults;
		const parsed = JSON.parse(raw);
		return {
			theme: parsed.theme === "light" ? "light" : "dark",
			locale: LOCALES.includes(parsed.locale) ? parsed.locale : "de",
			mode: parsed.mode === "online" || parsed.mode === "bluetooth" ? parsed.mode : "local"
		};
	} catch {
		return defaults;
	}
}
function applyDom(next) {
	if (typeof document === "undefined") return;
	const root = document.documentElement;
	root.classList.toggle("light", next.theme === "light");
	root.classList.toggle("dark", next.theme !== "light");
	root.lang = next.locale === "zh" ? "zh-Hans" : next.locale;
	const meta = document.querySelector("meta[name=\"theme-color\"]");
	if (meta) meta.setAttribute("content", next.theme === "light" ? "#f3f1ec" : "#111113");
}
var SettingsContext = (0, import_react.createContext)(null);
function SettingsProvider({ children }) {
	const [settings, setSettings] = (0, import_react.useState)(() => typeof window === "undefined" ? defaults : readStored());
	(0, import_react.useEffect)(() => {
		const stored = readStored();
		setSettings(stored);
		applyDom(stored);
	}, []);
	const commit = (0, import_react.useCallback)((patch) => {
		setSettings((prev) => {
			const next = {
				...prev,
				...patch
			};
			try {
				localStorage.setItem(STORAGE, JSON.stringify(next));
			} catch {}
			applyDom(next);
			return next;
		});
	}, []);
	const api = (0, import_react.useMemo)(() => ({
		...settings,
		setTheme: (theme) => commit({ theme }),
		setLocale: (locale) => commit({ locale }),
		setMode: (mode) => commit({ mode }),
		t: (key, vars) => translate(settings.locale, key, vars)
	}), [settings, commit]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsContext.Provider, {
		value: api,
		children
	});
}
function useSettings() {
	const ctx = (0, import_react.useContext)(SettingsContext);
	if (!ctx) throw new Error("useSettings outside provider");
	return ctx;
}
function useT() {
	return useSettings().t;
}
function isStandalone() {
	if (typeof window === "undefined") return false;
	const mq = window.matchMedia("(display-mode: standalone)").matches;
	const nav = window.navigator;
	return mq || nav.standalone === true;
}
function detectPlatform() {
	if (typeof window === "undefined") return "desktop";
	const ua = window.navigator.userAgent;
	if (/iPad|iPhone|iPod/.test(ua) || navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1) return "ios";
	if (/Android/i.test(ua)) return "android";
	return "desktop";
}
function PwaBoot() {
	(0, import_react.useEffect)(() => {
		if (!("serviceWorker" in navigator)) return;
		navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {});
	}, []);
	return null;
}
function useInstallPrompt() {
	const [deferred, setDeferred] = (0, import_react.useState)(null);
	const [installed, setInstalled] = (0, import_react.useState)(false);
	const [platform, setPlatform] = (0, import_react.useState)("desktop");
	(0, import_react.useEffect)(() => {
		setInstalled(isStandalone());
		setPlatform(detectPlatform());
		const onPrompt = (event) => {
			event.preventDefault();
			setDeferred(event);
		};
		const onInstalled = () => {
			setInstalled(true);
			setDeferred(null);
		};
		window.addEventListener("beforeinstallprompt", onPrompt);
		window.addEventListener("appinstalled", onInstalled);
		return () => {
			window.removeEventListener("beforeinstallprompt", onPrompt);
			window.removeEventListener("appinstalled", onInstalled);
		};
	}, []);
	async function nativeInstall() {
		if (!deferred) return false;
		await deferred.prompt();
		const choice = await deferred.userChoice;
		if (choice.outcome === "accepted") setInstalled(true);
		setDeferred(null);
		return choice.outcome === "accepted";
	}
	return {
		deferred,
		installed,
		platform,
		nativeInstall,
		canNative: Boolean(deferred)
	};
}
function InstallButton({ variant = "secondary", className, compact = false }) {
	const { installed, canNative, platform, nativeInstall } = useInstallPrompt();
	const [open, setOpen] = (0, import_react.useState)(false);
	const t = useT();
	if (installed) {
		if (compact) return null;
		return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-center text-xs text-faint",
			children: t("install.done")
		});
	}
	async function onClick() {
		if (canNative) {
			if (await nativeInstall()) return;
		}
		if (platform === "ios") {
			window.location.href = "/?install=1&platform=ios";
			return;
		}
		setOpen(true);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
		type: "button",
		variant: compact ? "ghost" : variant,
		className: className ?? (compact ? "h-10 w-full justify-start rounded-lg px-3 text-muted" : "h-12 w-full rounded-lg"),
		onClick: () => void onClick(),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "size-4" }), platform === "ios" ? t("install.ios") : t("install.cta")]
	}), open && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(InstallSheet, {
		platform,
		onClose: () => setOpen(false)
	})] });
}
function InstallSheet({ platform, onClose }) {
	const t = useT();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-50 flex items-end justify-center bg-bg/70 p-3 lg:items-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "relative w-full max-w-md rounded-2xl bg-surface p-5 shadow-[var(--shadow-lift)]",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: onClose,
					className: "absolute right-3 top-3 grid size-10 place-items-center text-muted",
					"aria-label": t("common.close"),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-4" })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "pr-8 font-display text-xl tracking-[0.12em]",
					children: t("install.title")
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm leading-relaxed text-muted",
					children: t("install.body")
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
					className: "mt-5 space-y-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Step, {
							icon: Smartphone,
							title: "iPhone / iPad",
							active: platform === "ios",
							body: t("install.stepIos")
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Step, {
							icon: Smartphone,
							title: "Android",
							active: platform === "android",
							body: t("install.stepAndroid")
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Step, {
							icon: Monitor,
							title: "Windows",
							active: platform === "desktop",
							body: t("install.stepDesktop")
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-5 grid grid-cols-2 gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: "/api/native?kind=apk",
						className: "flex h-12 items-center justify-center rounded-lg bg-elevated text-sm font-medium",
						children: "APK"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: "/api/native?kind=exe",
						className: "flex h-12 items-center justify-center rounded-lg bg-elevated text-sm font-medium",
						children: "EXE"
					})]
				}),
				platform === "ios" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					className: "mt-3 h-12 w-full rounded-lg",
					onClick: () => {
						window.location.href = "/?install=1&platform=ios";
					},
					children: "iPhone"
				})
			]
		})
	});
}
function Step({ icon: Icon, title, body, active }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
		className: "flex gap-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: active ? "grid size-10 shrink-0 place-items-center rounded-lg bg-fg text-bg" : "grid size-10 shrink-0 place-items-center rounded-lg bg-elevated text-muted",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-4" })
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "block text-sm font-medium",
			children: title
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "text-sm leading-relaxed text-muted",
			children: body
		})] })]
	});
}
function InviteButton({ handle }) {
	async function share() {
		const url = typeof window !== "undefined" ? window.location.origin : "";
		const text = handle ? `Schreib mir auf Offchat — @${handle}` : "Offchat — Chat, Pay, Post. Nur echte Menschen.";
		try {
			if (navigator.share) {
				await navigator.share({
					title: "OFFCHAT",
					text,
					url
				});
				return;
			}
			await navigator.clipboard.writeText(url ? `${text} ${url}` : text);
		} catch {}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
		type: "button",
		variant: "secondary",
		className: "h-11 rounded-lg",
		onClick: () => void share(),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Share, { className: "size-4" }), "Freund:innen einladen"]
	});
}
var styles_default = "/assets/styles-DHPXC6WS.css";
var APP_NAME = "OFFCHAT";
var fetchSessionUser = createServerFn({ method: "GET" }).handler(createSsrRpc("2c4985e96c199268f7f639534cb5e8e31d6b19d43286bf77416413db60ffde26"));
var Route$16 = createRootRoute({
	beforeLoad: async () => ({ sessionUser: await fetchSessionUser() }),
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1, viewport-fit=cover"
			},
			{ title: APP_NAME },
			{
				name: "theme-color",
				content: "#111113"
			},
			{
				name: "apple-mobile-web-app-title",
				content: APP_NAME
			},
			{
				name: "apple-mobile-web-app-status-bar-style",
				content: "black"
			},
			{
				name: "mobile-web-app-capable",
				content: "yes"
			},
			{
				name: "description",
				content: "OFFCHAT — Social Media im lokalen Netz. Feed, Chat, Posts. Internet nur für NOX."
			}
		],
		links: [
			{
				rel: "icon",
				type: "image/svg+xml",
				href: "/favicon.svg"
			},
			{
				rel: "apple-touch-icon",
				href: "/__grok/icon-180.png"
			},
			{
				rel: "apple-touch-icon",
				sizes: "180x180",
				href: "/apple-touch-icon.png"
			},
			{
				rel: "manifest",
				href: "/manifest.webmanifest"
			},
			{
				rel: "manifest",
				href: "/__grok/manifest.webmanifest"
			},
			{
				rel: "stylesheet",
				href: styles_default
			},
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&family=Oswald:wght@500;600&family=Noto+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Noto+Sans+SC:wght@400;500;700&display=swap"
			}
		]
	}),
	component: Root
});
function Root() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("html", {
		lang: "de",
		className: "dark antialiased",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("head", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeadContent, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("script", { dangerouslySetInnerHTML: { __html: `try{var s=JSON.parse(localStorage.getItem("offchat-settings")||"{}");var t=s.theme==="light"?"light":"dark";var l=s.locale||"de";document.documentElement.classList.toggle("light",t==="light");document.documentElement.classList.toggle("dark",t!=="light");document.documentElement.lang=l==="zh"?"zh-Hans":l;}catch(e){}` } })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("body", {
			className: "bg-bg text-fg",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PreviewHostBridge, {}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PwaBoot, {}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SettingsProvider, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuthProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ThemedToaster, {})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scripts, {})
			]
		})]
	});
}
function ThemedToaster() {
	const { theme } = useSettings();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster, {
		theme,
		position: "top-center"
	});
}
var $$splitComponentImporter$11 = () => import("./routes-DEHbUo89.mjs");
var Route$15 = createFileRoute("/")({ component: lazyRouteComponent($$splitComponentImporter$11, "component") });
var $$splitComponentImporter$10 = () => import("./create-D73FiIc_.mjs");
var Route$14 = createFileRoute("/create")({ component: lazyRouteComponent($$splitComponentImporter$10, "component") });
var $$splitComponentImporter$9 = () => import("./get-CIGTVplF.mjs");
var Route$13 = createFileRoute("/get")({ component: lazyRouteComponent($$splitComponentImporter$9, "component") });
var $$splitComponentImporter$8 = () => import("./login-Chq4IE2h.mjs");
var Route$12 = createFileRoute("/login")({ component: lazyRouteComponent($$splitComponentImporter$8, "component") });
var $$splitComponentImporter$7 = () => import("./messages-BmtllbCX.mjs");
var Route$11 = createFileRoute("/messages")({ component: lazyRouteComponent($$splitComponentImporter$7, "component") });
var $$splitComponentImporter$6 = () => import("./online-BaQW28f-.mjs");
var Route$10 = createFileRoute("/online")({ component: lazyRouteComponent($$splitComponentImporter$6, "component") });
var $$splitComponentImporter$5 = () => import("./profile-EE7IM4AW.mjs");
var Route$9 = createFileRoute("/profile")({ component: lazyRouteComponent($$splitComponentImporter$5, "component") });
var $$splitComponentImporter$4 = () => import("./settings-VshPjxpY.mjs");
var Route$8 = createFileRoute("/settings")({ component: lazyRouteComponent($$splitComponentImporter$4, "component") });
var $$splitComponentImporter$3 = () => import("./wallet-ClPVg3uR.mjs");
var Route$7 = createFileRoute("/wallet")({ component: lazyRouteComponent($$splitComponentImporter$3, "component") });
var $$splitComponentImporter$2 = () => import("./wlan-C1o2FyfX.mjs");
var Route$6 = createFileRoute("/wlan")({ component: lazyRouteComponent($$splitComponentImporter$2, "component") });
/**
* Room event bus: chat, likes, posts, presence. Complements WebRTC so messages
* still arrive when a café Wi-Fi blocks device-to-device (AP isolation).
*/
var ID$1 = string().regex(/^[a-zA-Z0-9_-]{1,64}$/);
var eventSchema = object({
	room: ID$1,
	from: ID$1,
	payload: unknown().refine((v) => v !== void 0 && JSON.stringify(v).length <= 12e5, { message: "payload too large" })
});
var EVENT_TTL_SECONDS = 21600;
var globalRef$1 = globalThis;
function ensureSchema$1(sql) {
	globalRef$1.__lanBusSchemaPromise__ ??= (async () => {
		await sql.query(`CREATE TABLE IF NOT EXISTS lan_events (
         id BIGSERIAL PRIMARY KEY,
         room TEXT NOT NULL,
         from_peer TEXT NOT NULL,
         payload JSONB NOT NULL,
         created_at TIMESTAMPTZ NOT NULL DEFAULT now()
       )`);
		await sql.query(`CREATE INDEX IF NOT EXISTS lan_events_room_id ON lan_events (room, id)`);
	})().catch((err) => {
		globalRef$1.__lanBusSchemaPromise__ = void 0;
		throw err;
	});
	return globalRef$1.__lanBusSchemaPromise__;
}
async function prune$1(sql) {
	await sql.query(`DELETE FROM lan_events WHERE created_at < now() - make_interval(secs => $1)`, [EVENT_TTL_SECONDS]);
}
function json$1(body, status = 200) {
	return new Response(JSON.stringify(body), {
		status,
		headers: {
			"content-type": "application/json",
			"cache-control": "no-store"
		}
	});
}
async function handleGet$1(url) {
	const parsed = object({
		room: ID$1,
		peer: ID$1,
		since: number$1().int().min(0).default(0)
	}).safeParse({
		room: url.searchParams.get("room"),
		peer: url.searchParams.get("peer"),
		since: url.searchParams.get("since") ?? 0
	});
	if (!parsed.success) return json$1({ error: "invalid query" }, 400);
	const { room, peer, since } = parsed.data;
	const sql = await getSql();
	await ensureSchema$1(sql);
	if (since === 0 || Math.random() < .05) await prune$1(sql);
	return json$1({ events: (since === 0 ? await sql.query(`SELECT id, from_peer, payload FROM (
             SELECT id, from_peer, payload FROM lan_events
             WHERE room = $1 AND from_peer <> $2
             ORDER BY id DESC LIMIT 200
           ) q ORDER BY id ASC`, [room, peer]) : await sql.query(`SELECT id, from_peer, payload FROM lan_events
           WHERE room = $1 AND from_peer <> $2 AND id > $3
           ORDER BY id ASC LIMIT 200`, [
		room,
		peer,
		since
	])).map((r) => ({
		id: r.id,
		from: r.from_peer,
		payload: r.payload
	})) });
}
async function handlePost$1(request) {
	let body;
	try {
		body = await request.json();
	} catch {
		return json$1({ error: "invalid JSON" }, 400);
	}
	const parsed = eventSchema.safeParse(body);
	if (!parsed.success) return json$1({ error: "invalid request" }, 400);
	const sql = await getSql();
	await ensureSchema$1(sql);
	await sql.query(`INSERT INTO lan_events (room, from_peer, payload) VALUES ($1, $2, $3)`, [
		parsed.data.room,
		parsed.data.from,
		JSON.stringify(parsed.data.payload)
	]);
	return json$1({ ok: true });
}
async function handleLanBus(request) {
	try {
		if (request.method === "GET") return await handleGet$1(new URL(request.url));
		if (request.method === "POST") return await handlePost$1(request);
		return json$1({ error: "method not allowed" }, 405);
	} catch (error) {
		console.error("[lan-bus]", error);
		return json$1({ error: "lan bus failed" }, 500);
	}
}
var handle$2 = ({ request }) => handleLanBus(request);
var Route$5 = createFileRoute("/api/lan")({ server: { handlers: {
	GET: handle$2,
	POST: handle$2
} } });
var execFileAsync = promisify(execFile);
var BEG = "@@OFFCHAT_ORIGIN_BEG@@";
var END = "@@OFFCHAT_ORIGIN_END@@";
function fieldFor(origin, width) {
	const innerW = width - 22 - 22;
	let inner = origin.replace(/\/+$/, "");
	if (inner.length > innerW) inner = inner.slice(0, innerW);
	return BEG + inner.padEnd(innerW, " ") + END;
}
function patchPacked(buf, origin) {
	const text = buf.toString("latin1");
	let from = 0;
	let i = -1;
	let j = -1;
	while (from < text.length) {
		const bi = text.indexOf(BEG, from);
		if (bi < 0) break;
		const ej = text.indexOf(END, bi + 22);
		if (ej > bi + 22) {
			i = bi;
			j = ej;
			break;
		}
		from = bi + 22;
	}
	if (i < 0 || j < 0) return buf;
	const width = j + 22 - i;
	const next = fieldFor(origin, width);
	if (next.length !== width) return buf;
	const out = Buffer.from(text, "latin1");
	out.write(next, i, width, "latin1");
	return out;
}
function candidate(kind) {
	const name = kind === "exe" ? "OFFCHAT.exe" : "OFFCHAT.apk";
	return [
		path.join(process.cwd(), "native/dist", name),
		path.join(process.cwd(), "public/downloads", name),
		`/workspace/native/dist/${name}`,
		`/workspace/public/downloads/${name}`
	];
}
async function readTemplate(kind) {
	for (const p of candidate(kind)) if (existsSync(p)) return readFile(p);
	throw new Error("missing-native");
}
function publicOrigin(request) {
	const xfHost = request.headers.get("x-forwarded-host");
	const xfProto = request.headers.get("x-forwarded-proto") || "https";
	if (xfHost) {
		const host = xfHost.split(",")[0]?.trim();
		if (host && host !== "127.0.0.1" && host !== "localhost") return `${xfProto}://${host}`;
	}
	for (const header of ["origin", "referer"]) {
		const raw = request.headers.get(header);
		if (!raw) continue;
		try {
			const u = new URL(raw);
			if (u.hostname !== "127.0.0.1" && u.hostname !== "localhost") return u.origin;
		} catch {}
	}
	try {
		const u = new URL(request.url);
		if (u.hostname !== "127.0.0.1" && u.hostname !== "localhost") return u.origin;
	} catch {}
	return "";
}
async function packNative(kind, origin) {
	const raw = await readTemplate(kind);
	if (kind === "exe") return {
		bytes: origin ? patchPacked(raw, origin) : raw,
		filename: "OFFCHAT.exe",
		type: "application/vnd.microsoft.portable-executable"
	};
	return {
		bytes: origin ? await patchApk(raw, origin) : raw,
		filename: "OFFCHAT.apk",
		type: "application/vnd.android.package-archive"
	};
}
async function patchApk(raw, origin) {
	const dir = await mkdtemp(path.join(tmpdir(), "offchat-apk-"));
	const inFile = path.join(dir, "in.apk");
	const outFile = path.join(dir, "out.apk");
	const py = path.join(dir, "patch.py");
	try {
		await writeFile(inFile, raw);
		await writeFile(py, `
import zipfile, shutil, sys
src, dst, origin = sys.argv[1], sys.argv[2], sys.argv[3]
BEG, END = "@@OFFCHAT_ORIGIN_BEG@@", "@@OFFCHAT_ORIGIN_END@@"
shutil.copyfile(src, dst)
with zipfile.ZipFile(src, "r") as zin, zipfile.ZipFile(dst, "w") as zout:
    for info in zin.infolist():
        data = zin.read(info.filename)
        if info.filename.startswith("META-INF/") and info.filename.upper().endswith((".SF", ".RSA", ".DSA", ".EC", ".MF")):
            continue
        if info.filename == "assets/start_url.txt":
            text = data.decode("latin1")
            i, j = text.find(BEG), text.find(END)
            if i >= 0 and j > i:
                width = j + len(END) - i
                inner_w = width - len(BEG) - len(END)
                inner = origin.rstrip("/")[:inner_w].ljust(inner_w)
                text = text[:i] + BEG + inner + END + text[i+width:]
                data = text.encode("latin1")
        zout.writestr(info, data)
`);
		await execFileAsync("python3", [
			py,
			inFile,
			outFile,
			origin
		]);
		return await signApk(await readFile(outFile));
	} catch {
		return raw;
	} finally {
		await unlink(inFile).catch(() => void 0);
		await unlink(outFile).catch(() => void 0);
		await unlink(py).catch(() => void 0);
	}
}
async function signApk(unsigned) {
	const keystore = [path.join(process.cwd(), "native/android/app/offchat.keystore"), "/workspace/native/android/app/offchat.keystore"].find((p) => existsSync(p));
	const apksigner = ["/workspace/.native/android-sdk/build-tools/34.0.0/apksigner", path.join(process.cwd(), ".native/android-sdk/build-tools/34.0.0/apksigner")].find((p) => existsSync(p));
	if (!keystore || !apksigner) return unsigned;
	const dir = await mkdtemp(path.join(tmpdir(), "offchat-sign-"));
	const inFile = path.join(dir, "in.apk");
	const signed = path.join(dir, "out.apk");
	try {
		await writeFile(inFile, unsigned);
		await execFileAsync(apksigner, [
			"sign",
			"--ks",
			keystore,
			"--ks-key-alias",
			"offchat",
			"--ks-pass",
			"pass:offchat1",
			"--key-pass",
			"pass:offchat1",
			"--out",
			signed,
			inFile
		]);
		return await readFile(signed);
	} catch {
		return unsigned;
	} finally {
		await unlink(inFile).catch(() => void 0);
		await unlink(signed).catch(() => void 0);
	}
}
async function handle$1({ request }) {
	const kind = new URL(request.url).searchParams.get("kind") === "exe" ? "exe" : "apk";
	try {
		const file = await packNative(kind, publicOrigin(request));
		return new Response(new Uint8Array(file.bytes), { headers: {
			"content-type": file.type,
			"content-disposition": `attachment; filename="${file.filename}"`,
			"cache-control": "no-store"
		} });
	} catch {
		return new Response("not found", { status: 404 });
	}
}
var Route$4 = createFileRoute("/api/native")({ server: { handlers: { GET: handle$1 } } });
/**
* WebRTC signaling over the app database (Neon deployed, PGLite in preview).
* Only rendezvous traffic passes through here — roster + SDP/ICE relay while a
* mesh forms; chat data then flows peer-to-peer.
*/
var ID = string().regex(/^[a-zA-Z0-9_-]{1,64}$/);
var signalSchema = object({
	op: literal("signal"),
	room: ID,
	from: ID,
	to: ID,
	kind: _enum([
		"offer",
		"answer",
		"ice"
	]),
	payload: unknown().refine((v) => v !== void 0 && JSON.stringify(v).length <= 32768, { message: "payload too large" })
});
var leaveSchema = object({
	op: literal("leave"),
	room: ID,
	peer: ID
});
var postSchema = discriminatedUnion("op", [signalSchema, leaveSchema]);
var PEER_TTL_SECONDS = 30;
var SIGNAL_TTL_SECONDS = 60;
var globalRef = globalThis;
function ensureSchema(sql) {
	globalRef.__rtcSchemaPromise__ ??= (async () => {
		await sql.query(`CREATE TABLE IF NOT EXISTS webrtc_peers (
         room TEXT NOT NULL,
         peer_id TEXT NOT NULL,
         name TEXT NOT NULL DEFAULT '',
         last_seen TIMESTAMPTZ NOT NULL DEFAULT now(),
         PRIMARY KEY (room, peer_id)
       )`);
		await sql.query(`CREATE TABLE IF NOT EXISTS webrtc_signals (
         id BIGSERIAL PRIMARY KEY,
         room TEXT NOT NULL,
         to_peer TEXT NOT NULL,
         from_peer TEXT NOT NULL,
         kind TEXT NOT NULL,
         payload JSONB NOT NULL,
         created_at TIMESTAMPTZ NOT NULL DEFAULT now()
       )`);
		await sql.query(`CREATE INDEX IF NOT EXISTS webrtc_signals_inbox
         ON webrtc_signals (room, to_peer, id)`);
	})().catch((err) => {
		globalRef.__rtcSchemaPromise__ = void 0;
		throw err;
	});
	return globalRef.__rtcSchemaPromise__;
}
async function roster(sql, room) {
	return (await sql.query(`SELECT peer_id, name FROM webrtc_peers
     WHERE room = $1 AND last_seen > now() - make_interval(secs => $2)
     ORDER BY peer_id LIMIT 32`, [room, PEER_TTL_SECONDS])).map((r) => ({
		id: r.peer_id,
		name: r.name
	}));
}
async function touchPeer(sql, room, peer, name) {
	await sql.query(`INSERT INTO webrtc_peers (room, peer_id, name, last_seen)
     VALUES ($1, $2, $3, now())
     ON CONFLICT (room, peer_id)
     DO UPDATE SET last_seen = now(), name = EXCLUDED.name`, [
		room,
		peer,
		name
	]);
}
async function prune(sql) {
	await Promise.all([sql.query(`DELETE FROM webrtc_signals WHERE created_at < now() - make_interval(secs => $1)`, [SIGNAL_TTL_SECONDS]), sql.query(`DELETE FROM webrtc_peers WHERE last_seen < now() - make_interval(secs => $1)`, [PEER_TTL_SECONDS])]);
}
function json(body, status = 200) {
	return new Response(JSON.stringify(body), {
		status,
		headers: {
			"content-type": "application/json",
			"cache-control": "no-store"
		}
	});
}
async function handleGet(url) {
	const parsed = object({
		room: ID,
		peer: ID,
		name: string().max(64).default(""),
		since: number$1().int().min(0).default(0)
	}).safeParse({
		room: url.searchParams.get("room"),
		peer: url.searchParams.get("peer"),
		name: url.searchParams.get("name") ?? "",
		since: url.searchParams.get("since") ?? 0
	});
	if (!parsed.success) return json({ error: "invalid query" }, 400);
	const { room, peer, name, since } = parsed.data;
	const sql = await getSql();
	await ensureSchema(sql);
	if (since === 0 || Math.random() < .02) await prune(sql);
	await touchPeer(sql, room, peer, name);
	const rows = await sql.query(`SELECT id, from_peer, kind, payload FROM webrtc_signals
     WHERE room = $1 AND to_peer = $2 AND id > $3
     ORDER BY id LIMIT 200`, [
		room,
		peer,
		since
	]);
	return json({
		peers: await roster(sql, room),
		signals: rows.map((r) => ({
			id: r.id,
			from: r.from_peer,
			kind: r.kind,
			payload: r.payload
		}))
	});
}
async function handlePost(request) {
	let body;
	try {
		body = await request.json();
	} catch {
		return json({ error: "invalid JSON" }, 400);
	}
	const parsed = postSchema.safeParse(body);
	if (!parsed.success) return json({ error: "invalid request" }, 400);
	const msg = parsed.data;
	const sql = await getSql();
	await ensureSchema(sql);
	if (msg.op === "signal") await sql.query(`INSERT INTO webrtc_signals (room, to_peer, from_peer, kind, payload)
       VALUES ($1, $2, $3, $4, $5)`, [
		msg.room,
		msg.to,
		msg.from,
		msg.kind,
		JSON.stringify(msg.payload)
	]);
	else await sql.query(`DELETE FROM webrtc_peers WHERE room = $1 AND peer_id = $2`, [msg.room, msg.peer]);
	return json({ ok: true });
}
async function handleSignaling(request) {
	try {
		if (request.method === "GET") return await handleGet(new URL(request.url));
		if (request.method === "POST") return await handlePost(request);
		return json({ error: "method not allowed" }, 405);
	} catch (error) {
		console.error("[rtc] signaling error:", error);
		return json({ error: "signaling failed" }, 500);
	}
}
var handle = ({ request }) => handleSignaling(request);
var Route$3 = createFileRoute("/api/rtc")({ server: { handlers: {
	GET: handle,
	POST: handle
} } });
var $$splitComponentImporter$1 = () => import("./c._conversationId-C-T73egQ.mjs");
var Route$2 = createFileRoute("/c/$conversationId")({ component: lazyRouteComponent($$splitComponentImporter$1, "component") });
var $$splitComponentImporter = () => import("./u._userId-ClZ33MUR.mjs");
var Route$1 = createFileRoute("/u/$userId")({ component: lazyRouteComponent($$splitComponentImporter, "component") });
var Route = createFileRoute("/api/auth/$")({ server: { handlers: {
	GET: ({ request }) => auth.handler(request),
	POST: ({ request }) => auth.handler(request)
} } });
var rootRouteChildren = {
	IndexRoute: Route$15.update({
		id: "/",
		path: "/",
		getParentRoute: () => Route$16
	}),
	CreateRoute: Route$14.update({
		id: "/create",
		path: "/create",
		getParentRoute: () => Route$16
	}),
	GetRoute: Route$13.update({
		id: "/get",
		path: "/get",
		getParentRoute: () => Route$16
	}),
	LoginRoute: Route$12.update({
		id: "/login",
		path: "/login",
		getParentRoute: () => Route$16
	}),
	MessagesRoute: Route$11.update({
		id: "/messages",
		path: "/messages",
		getParentRoute: () => Route$16
	}),
	OnlineRoute: Route$10.update({
		id: "/online",
		path: "/online",
		getParentRoute: () => Route$16
	}),
	ProfileRoute: Route$9.update({
		id: "/profile",
		path: "/profile",
		getParentRoute: () => Route$16
	}),
	SettingsRoute: Route$8.update({
		id: "/settings",
		path: "/settings",
		getParentRoute: () => Route$16
	}),
	WalletRoute: Route$7.update({
		id: "/wallet",
		path: "/wallet",
		getParentRoute: () => Route$16
	}),
	WlanRoute: Route$6.update({
		id: "/wlan",
		path: "/wlan",
		getParentRoute: () => Route$16
	}),
	ApiLanRoute: Route$5.update({
		id: "/api/lan",
		path: "/api/lan",
		getParentRoute: () => Route$16
	}),
	ApiNativeRoute: Route$4.update({
		id: "/api/native",
		path: "/api/native",
		getParentRoute: () => Route$16
	}),
	ApiRtcRoute: Route$3.update({
		id: "/api/rtc",
		path: "/api/rtc",
		getParentRoute: () => Route$16
	}),
	CConversationIdRoute: Route$2.update({
		id: "/c/$conversationId",
		path: "/c/$conversationId",
		getParentRoute: () => Route$16
	}),
	UUserIdRoute: Route$1.update({
		id: "/u/$userId",
		path: "/u/$userId",
		getParentRoute: () => Route$16
	}),
	ApiAuthSplatRoute: Route.update({
		id: "/api/auth/$",
		path: "/api/auth/$",
		getParentRoute: () => Route$16
	})
};
var routeTree = Route$16._addFileChildren(rootRouteChildren)._addFileTypes();
var router_exports = /* @__PURE__ */ __exportAll({ getRouter: () => getRouter });
function getRouter() {
	return createRouter({
		routeTree,
		defaultErrorComponent: AppErrorComponent
	});
}
//#endregion
export { InviteButton as a, LOCALES as c, cn as d, createSsrRpc as f, InstallButton as i, LOCALE_META as l, Route$1 as n, useSettings as o, Route$2 as r, useT as s, router_exports as t, Button as u };
