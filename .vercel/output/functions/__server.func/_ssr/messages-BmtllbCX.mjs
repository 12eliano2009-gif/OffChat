import { C as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as RequireSignIn, t as AppFrame } from "./signed-in-B-7bejH-.mjs";
import { t as Inbox } from "./inbox-CgGHJwmn.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/messages-BmtllbCX.js
var import_jsx_runtime = require_jsx_runtime();
function MessagesPage() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RequireSignIn, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppFrame, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "mx-auto flex min-h-[calc(100dvh-3rem)] max-w-lg flex-col tab-safe lg:min-h-dvh",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Inbox, {})
	}) }) });
}
//#endregion
export { MessagesPage as component };
