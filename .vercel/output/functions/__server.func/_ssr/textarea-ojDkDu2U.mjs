import { C as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { d as cn } from "./router-By-l8WBZ.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/textarea-ojDkDu2U.js
var import_jsx_runtime = require_jsx_runtime();
function Textarea({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
		suppressHydrationWarning: true,
		className: cn("flex min-h-24 w-full rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-fg", "placeholder:text-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60", "disabled:cursor-not-allowed disabled:opacity-50", className),
		...props
	});
}
//#endregion
export { Textarea as t };
