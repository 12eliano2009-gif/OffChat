import { C as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { d as cn } from "./router-By-l8WBZ.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/input-CpxBPLku.js
var import_jsx_runtime = require_jsx_runtime();
function Input({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
		suppressHydrationWarning: true,
		className: cn("flex h-11 w-full rounded-md border border-border bg-elevated px-3 text-sm text-fg", "placeholder:text-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60", "disabled:cursor-not-allowed disabled:opacity-50", className),
		...props
	});
}
//#endregion
export { Input as t };
