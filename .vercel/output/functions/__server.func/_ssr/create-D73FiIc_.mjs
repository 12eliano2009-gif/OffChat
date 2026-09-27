import { o as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { C as require_jsx_runtime, x as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { b as LoaderCircle, x as ImagePlus } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { s as useT, u as Button } from "./router-By-l8WBZ.mjs";
import { n as RequireSignIn, t as AppFrame, y as useLan } from "./signed-in-B-7bejH-.mjs";
import { n as fileToMedia } from "./media-Da3cWhLi.mjs";
import { t as EmojiPicker } from "./emoji-picker-DM86Gaf2.mjs";
import { t as Textarea } from "./textarea-ojDkDu2U.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/create-D73FiIc_.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function CreatePost() {
	const lan = useLan();
	const t = useT();
	const navigate = useNavigate();
	const inputRef = (0, import_react.useRef)(null);
	const [caption, setCaption] = (0, import_react.useState)("");
	const [preview, setPreview] = (0, import_react.useState)(null);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [picking, setPicking] = (0, import_react.useState)(false);
	async function onFile(file) {
		if (!file) return;
		setPicking(true);
		try {
			const media = await fileToMedia(file);
			setPreview(media);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Datei ungültig.");
		} finally {
			setPicking(false);
		}
	}
	function publish() {
		if (!preview) return;
		setBusy(true);
		try {
			lan.publishPost({
				caption,
				...preview
			});
			toast.success(t("create.posted"));
			navigate({ to: "/" });
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Post fehlgeschlagen.");
			setBusy(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto w-full max-w-lg px-4 py-6 tab-safe",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "mb-2 font-display text-2xl tracking-[0.12em]",
				children: t("create.title")
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mb-5 text-sm text-muted",
				children: t("create.hint", { net: lan.net?.label ?? t("lan.local") })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				ref: inputRef,
				type: "file",
				accept: "image/*,video/*",
				className: "sr-only",
				onChange: (e) => void onFile(e.target.files?.[0])
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: () => inputRef.current?.click(),
				className: "mb-4 flex aspect-[4/5] w-full items-center justify-center overflow-hidden rounded-xl bg-elevated shadow-[var(--shadow-border)]",
				children: preview?.mediaType === "video" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
					src: preview.mediaUrl,
					poster: preview.posterUrl ?? void 0,
					className: "size-full object-cover",
					muted: true,
					playsInline: true,
					controls: true
				}) : preview ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					src: preview.mediaUrl,
					alt: "",
					className: "size-full object-cover"
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "flex flex-col items-center gap-2 text-muted",
					children: [
						picking ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-7 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ImagePlus, { className: "size-7" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-sm",
							children: t("create.pick")
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs text-faint",
							children: "Videos bis 2,4 MB"
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
					value: caption,
					onChange: (e) => setCaption(e.target.value),
					placeholder: t("create.caption"),
					maxLength: 500,
					className: "min-h-24 pr-12"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "absolute bottom-1 right-1",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmojiPicker, { onPick: (e) => setCaption((prev) => prev + e) })
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				className: "mt-4 h-12 w-full rounded-lg",
				disabled: !preview || busy,
				onClick: publish,
				children: busy ? "…" : t("create.share")
			})
		]
	});
}
function CreatePage() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RequireSignIn, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppFrame, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CreatePost, {}) }) });
}
//#endregion
export { CreatePage as component };
