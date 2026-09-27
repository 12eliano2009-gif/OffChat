import { Check, ImagePlus, Loader2 } from "lucide-react";
import { useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { fileToMedia } from "@/lib/offx/media";
import { useT } from "@/lib/offx/settings";
import type { PostKeep } from "@/lib/offx/types";
import { useLan } from "./lan-provider";
import { EmojiPicker } from "./emoji-picker";

const KEEPS: { id: PostKeep; title: "create.keepNetwork" | "create.keepProfile" | "create.keepLeave"; hint: "create.keepNetworkHint" | "create.keepProfileHint" | "create.keepLeaveHint" }[] = [
  { id: "network", title: "create.keepNetwork", hint: "create.keepNetworkHint" },
  { id: "profile", title: "create.keepProfile", hint: "create.keepProfileHint" },
  { id: "leave", title: "create.keepLeave", hint: "create.keepLeaveHint" },
];

export function CreatePost() {
  const lan = useLan();
  const t = useT();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [caption, setCaption] = useState("");
  const [keep, setKeep] = useState<PostKeep | null>(null);
  const [preview, setPreview] = useState<{
    mediaType: "image" | "video";
    mediaUrl: string;
    posterUrl: string | null;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [picking, setPicking] = useState(false);

  async function onFile(file: File | undefined) {
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
    if (!keep) {
      toast.error(t("create.needKeep"));
      return;
    }
    setBusy(true);
    try {
      lan.publishPost({ caption, ...preview, keep });
      toast.success(
        keep === "profile"
          ? t("create.postedProfile")
          : keep === "leave"
            ? t("create.postedLeave")
            : t("create.postedNetwork"),
      );
      void navigate({ to: "/" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Post fehlgeschlagen.");
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-6 tab-safe">
      <h1 className="mb-2 font-display text-2xl tracking-[0.12em]">{t("create.title")}</h1>
      <p className="mb-5 text-sm text-muted">
        {t("create.hint", { net: lan.net?.label ?? t("lan.local") })}
      </p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*"
        className="sr-only"
        onChange={(e) => void onFile(e.target.files?.[0])}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="mb-4 flex aspect-[4/5] w-full items-center justify-center overflow-hidden rounded-xl bg-elevated shadow-[var(--shadow-border)]"
      >
        {preview?.mediaType === "video" ? (
          <video
            src={preview.mediaUrl}
            poster={preview.posterUrl ?? undefined}
            className="size-full object-cover"
            muted
            playsInline
            controls
          />
        ) : preview ? (
          <img src={preview.mediaUrl} alt="" className="size-full object-cover" />
        ) : (
          <span className="flex flex-col items-center gap-2 text-muted">
            {picking ? <Loader2 className="size-7 animate-spin" /> : <ImagePlus className="size-7" />}
            <span className="text-sm">{t("create.pick")}</span>
            <span className="text-xs text-faint">Videos bis 2,4 MB</span>
          </span>
        )}
      </button>
      <div className="relative">
        <Textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder={t("create.caption")}
          maxLength={500}
          className="min-h-24 pr-12"
        />
        <div className="absolute bottom-1 right-1">
          <EmojiPicker onPick={(e) => setCaption((prev) => prev + e)} />
        </div>
      </div>
      <fieldset className="mt-4 space-y-2" aria-required="true">
        <legend className="mb-2 text-xs uppercase tracking-[0.16em] text-faint">
          {t("create.keepLegend")}
        </legend>
        {KEEPS.map((opt) => {
          const on = keep === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => setKeep(opt.id)}
              className={`flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left shadow-[var(--shadow-border)] ${
                on ? "bg-fg text-bg" : "bg-elevated"
              }`}
            >
              <span
                className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border ${
                  on ? "border-bg bg-bg text-fg" : "border-current/40"
                }`}
              >
                {on && <Check className="size-3.5" strokeWidth={3} />}
              </span>
              <span>
                <span className="block text-sm font-medium">{t(opt.title)}</span>
                <span className={`mt-0.5 block text-xs leading-relaxed ${on ? "text-bg/70" : "text-faint"}`}>
                  {t(opt.hint)}
                </span>
              </span>
            </button>
          );
        })}
      </fieldset>
      {!keep && <p className="mt-3 text-xs text-faint">{t("create.needKeep")}</p>}
      <Button className="mt-4 h-12 w-full rounded-lg" disabled={!preview || !keep || busy} onClick={publish}>
        {busy ? "…" : t("create.share")}
      </Button>
    </div>
  );
}
