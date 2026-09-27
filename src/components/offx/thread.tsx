import { ChevronLeft } from "lucide-react";
import { useEffect, useRef } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "./avatar";
import { MessageBubble } from "./bubbles";
import { Composer } from "./composer";
import { useLan } from "./lan-provider";

export function Thread({ conversationId }: { conversationId: string }) {
  const lan = useLan();
  const data = lan.getThread(conversationId);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [data?.messages.length]);

  function onResolve(transactionId: string, action: "accept" | "decline") {
    try {
      lan.resolvePayment(transactionId, action);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Aktion fehlgeschlagen.");
    }
  }

  if (!data) {
    return (
      <div className="flex h-full flex-col">
        <ThreadBar />
        <p className="p-6 text-sm text-muted">
          Die Person ist nicht (mehr) in diesem Netz. Sobald sie Offchat im selben WLAN öffnet, ist sie wieder da.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-bg">
      <div className="flex h-14 items-center gap-2 border-b border-border px-2">
        <Link
          to="/messages"
          className="grid size-11 place-items-center text-fg lg:hidden"
          aria-label="Zurück"
        >
          <ChevronLeft className="size-6" />
        </Link>
        <Link
          to="/u/$userId"
          params={{ userId: data.other.userId }}
          className="flex min-w-0 items-center gap-2.5"
        >
          <UserAvatar
            name={data.other.displayName}
            hue={data.other.avatarHue}
            src={data.other.avatarUrl}
            system={data.other.isSystem}
            size="sm"
          />
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium">{data.other.displayName}</span>
            <span className="text-xs text-muted">@{data.other.handle} · hier im Netz</span>
          </span>
        </Link>
      </div>
      <div ref={scroller} className="flex-1 space-y-2 overflow-y-auto px-3 py-4">
        {data.messages.map((m, i) => {
          const prev = data.messages[i - 1];
          const stacked = prev?.senderId === m.senderId;
          return (
            <MessageBubble
              key={m.id}
              message={m}
              mine={m.senderId === data.me.userId}
              other={data.other}
              meId={data.me.userId}
              stacked={stacked}
              onResolve={(id, action) => onResolve(id, action)}
            />
          );
        })}
      </div>
      <Composer
        conversationId={conversationId}
        other={data.other}
        balance={lan.me.walletBalance}
        onMessages={() => undefined}
      />
    </div>
  );
}

function ThreadBar() {
  return (
    <div className="flex h-14 items-center gap-2 border-b border-border px-2">
      <Link to="/messages" className="grid size-11 place-items-center lg:hidden">
        <ChevronLeft className="size-6" />
      </Link>
      <Skeleton className="size-8 rounded-full" />
      <Skeleton className="h-4 w-28" />
    </div>
  );
}
