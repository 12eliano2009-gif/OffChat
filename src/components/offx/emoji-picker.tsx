import { Smile } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { useT } from "@/lib/offx/settings";

const EMOJIS = [
  "😀","😃","😄","😁","😆","😅","😂","🤣","😊","😇",
  "🙂","😉","😍","🥰","😘","😜","🤗","🤔","😴","😭",
  "😤","😡","🤯","😱","🥳","😎","🤩","😇","👋","👍",
  "👎","👏","🙏","🔥","❤️","🧡","💛","💚","💙","💜",
  "🖤","💯","✨","⭐","🎉","⚡️","🌙","☀️","🌸","🍀",
  "✅","❌","💬","📸","🎵","📍","💡","🫂","🤝","💪",
];

export function insertEmoji(value: string, emoji: string, el?: HTMLTextAreaElement | HTMLInputElement | null) {
  if (!el) return value + emoji;
  const start = el.selectionStart ?? value.length;
  const end = el.selectionEnd ?? value.length;
  return value.slice(0, start) + emoji + value.slice(end);
}

export function EmojiPicker({
  onPick,
  className,
}: {
  onPick: (emoji: string) => void;
  className?: string;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div ref={box} className={cn("relative", className)}>
      <button
        type="button"
        className="grid size-11 place-items-center rounded-full text-muted hover:text-fg"
        aria-label={t("composer.emoji")}
        onClick={() => setOpen((v) => !v)}
      >
        <Smile className="size-5" />
      </button>
      {open && (
        <div className="absolute bottom-[calc(100%+8px)] left-0 z-40 w-[min(18rem,calc(100vw-2rem))] rounded-2xl bg-surface p-2 shadow-[var(--shadow-lift)]">
          <div className="grid max-h-44 grid-cols-8 gap-0.5 overflow-y-auto">
            {EMOJIS.map((e) => (
              <button
                key={e}
                type="button"
                className="grid size-9 place-items-center rounded-md text-lg hover:bg-elevated"
                onClick={() => {
                  onPick(e);
                  setOpen(false);
                }}
              >
                {e}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
