import { C as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { o as hueStyle, s as initials } from "./packs-txKK3gaA.mjs";
import { d as cn } from "./router-By-l8WBZ.mjs";
import { n as OffxMark } from "./logo-puPl-3SD.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/avatar-COyG8STG.js
var import_jsx_runtime = require_jsx_runtime();
function UserAvatar({ name, hue, src, size = "md", system, className }) {
	const dim = size === "sm" ? "size-8 text-[10px]" : size === "lg" ? "size-14 text-lg" : size === "xl" ? "size-20 text-xl" : "size-11 text-xs";
	if (system && (name === "Offchat" || name === "OffX")) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: cn("grid place-items-center rounded-full bg-elevated text-fg shadow-[var(--shadow-border)]", dim, className),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OffxMark, { className: "h-[55%] w-[70%]" })
	});
	if (src) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
		src,
		alt: "",
		className: cn("rounded-full object-cover", dim, className)
	});
	const style = hueStyle(hue);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: cn("grid place-items-center rounded-full font-medium tracking-wide", dim, className),
		style,
		children: initials(name)
	});
}
//#endregion
export { UserAvatar as t };
