import { C as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as Route$1 } from "./router-By-l8WBZ.mjs";
import { n as RequireSignIn, t as AppFrame } from "./signed-in-B-7bejH-.mjs";
import { t as ProfileView } from "./profile-view-BJWPaL8j.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/u._userId-ClZ33MUR.js
var import_jsx_runtime = require_jsx_runtime();
function UserPage() {
	const { userId } = Route$1.useParams();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RequireSignIn, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppFrame, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProfileView, { userId }) }) });
}
//#endregion
export { UserPage as component };
