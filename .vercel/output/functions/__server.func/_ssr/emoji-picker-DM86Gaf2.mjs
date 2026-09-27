import { o as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { C as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { u as Smile } from "../_libs/lucide-react.mjs";
import { d as cn, s as useT } from "./router-By-l8WBZ.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/emoji-picker-DM86Gaf2.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var EMOJIS = [
	"😀",
	"😃",
	"😄",
	"😁",
	"😆",
	"😅",
	"😂",
	"🤣",
	"😊",
	"😇",
	"🙂",
	"😉",
	"😍",
	"🥰",
	"😘",
	"😜",
	"🤗",
	"🤔",
	"😴",
	"😭",
	"😤",
	"😡",
	"🤯",
	"😱",
	"🥳",
	"😎",
	"🤩",
	"😇",
	"👋",
	"👍",
	"👎",
	"👏",
	"🙏",
	"🔥",
	"❤️",
	"🧡",
	"💛",
	"💚",
	"💙",
	"💜",
	"🖤",
	"💯",
	"✨",
	"⭐",
	"🎉",
	"⚡️",
	"🌙",
	"☀️",
	"🌸",
	"🍀",
	"✅",
	"❌",
	"💬",
	"📸",
	"🎵",
	"📍",
	"💡",
	"🫂",
	"🤝",
	"💪"
];
function insertEmoji(value, emoji, el) {
	if (!el) return value + emoji;
	const start = el.selectionStart ?? value.length;
	const end = el.selectionEnd ?? value.length;
	return value.slice(0, start) + emoji + value.slice(end);
}
function EmojiPicker({ onPick, className }) {
	const t = useT();
	const [open, setOpen] = (0, import_react.useState)(false);
	const box = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		if (!open) return;
		const onDoc = (e) => {
			if (!box.current?.contains(e.target)) setOpen(false);
		};
		document.addEventListener("mousedown", onDoc);
		return () => document.removeEventListener("mousedown", onDoc);
	}, [open]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		ref: box,
		className: cn("relative", className),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			className: "grid size-11 place-items-center rounded-full text-muted hover:text-fg",
			"aria-label": t("composer.emoji"),
			onClick: () => setOpen((v) => !v),
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Smile, { className: "size-5" })
		}), open && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "absolute bottom-[calc(100%+8px)] left-0 z-40 w-[min(18rem,calc(100vw-2rem))] rounded-2xl bg-surface p-2 shadow-[var(--shadow-lift)]",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid max-h-44 grid-cols-8 gap-0.5 overflow-y-auto",
				children: EMOJIS.map((e) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "grid size-9 place-items-center rounded-md text-lg hover:bg-elevated",
					onClick: () => {
						onPick(e);
						setOpen(false);
					},
					children: e
				}, e))
			})
		})]
	});
}
//#endregion
export { insertEmoji as n, EmojiPicker as t };
