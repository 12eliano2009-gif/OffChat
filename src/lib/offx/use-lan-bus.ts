import { useCallback, useEffect, useRef } from "react";

export function useLanBus(options: {
  room: string;
  selfId: string;
  onEvent: (data: unknown) => void;
}) {
  const { room, selfId, onEvent } = options;
  const cursor = useRef(0);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;
  const joined = useRef(false);

  const post = useCallback(
    (payload: unknown) => {
      void fetch("/api/lan", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ room, from: selfId, payload }),
      }).catch(() => {});
    },
    [room, selfId],
  );

  useEffect(() => {
    cursor.current = 0;
    joined.current = false;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const tick = async () => {
      if (stopped) return;
      try {
        const params = new URLSearchParams({
          room,
          peer: selfId,
          since: String(cursor.current),
        });
        const res = await fetch(`/api/lan?${params}`);
        if (stopped) return;
        if (res.ok) {
          const body = (await res.json()) as {
            events?: { id: number; payload: unknown }[];
          };
          for (const ev of body.events ?? []) {
            cursor.current = Math.max(cursor.current, ev.id);
            onEventRef.current(ev.payload);
          }
          joined.current = true;
        }
      } catch {
        /* offline / cold */
      }
      if (!stopped) timer = setTimeout(() => void tick(), joined.current ? 700 : 400);
    };

    void tick();
    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
    };
  }, [room, selfId]);

  return { post };
}
