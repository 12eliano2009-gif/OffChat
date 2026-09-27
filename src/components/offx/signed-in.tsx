import { useEffect, useRef, useState, type ReactNode } from "react";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { Skeleton } from "@/components/ui/skeleton";
import { bootstrapMe, updateProfile } from "@/lib/offx/server";
import { cacheGet, cacheSet } from "@/lib/offx/offline";
import type { Profile } from "@/lib/offx/types";
import { VerifyEmail } from "./verify-email";
import { LanProvider } from "./lan-provider";

export function VerifyGate({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<Profile | null>(null);
  const [blocked, setBlocked] = useState(false);
  const meRef = useRef<Profile | null>(null);
  meRef.current = me;

  useEffect(() => {
    let alive = true;
    void (async () => {
      const cached = await cacheGet<Profile>("me");
      if (alive && cached) setMe(cached);
      try {
        const profile = await bootstrapMe();
        const local = meRef.current ?? cached;
        const merged = overlayLook(profile, local);
        await cacheSet("me", merged);
        if (alive) setMe(merged);
        if (looksRicher(local, profile)) {
          void updateProfile({
            data: {
              displayName: local!.displayName,
              handle: local!.handle,
              bio: local!.bio,
              avatarUrl: local!.avatarUrl,
            },
          })
            .then(async (saved) => {
              await cacheSet("me", saved);
              if (alive) setMe(saved);
            })
            .catch(() => undefined);
        }
      } catch {
        if (alive && !cached && !meRef.current) setBlocked(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (blocked && !me) {
    return (
      <div className="grid min-h-dvh place-items-center bg-bg px-6 text-center text-sm text-muted">
        Einmal mit Internet anmelden — danach läuft Offchat im lokalen Netz weiter.
      </div>
    );
  }
  if (!me) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-bg">
        <Skeleton className="h-10 w-40 rounded-lg" />
      </div>
    );
  }
  if (!me.emailVerified) {
    return <VerifyEmail onVerified={(next) => setMe(next)} />;
  }
  return (
    <LanProvider me={me} onMe={setMe}>
      {children}
    </LanProvider>
  );
}

function overlayLook(server: Profile, cached: Profile | null): Profile {
  if (!cached || cached.userId !== server.userId) return server;
  return {
    ...server,
    displayName: cached.displayName || server.displayName,
    handle: cached.handle || server.handle,
    bio: cached.bio ?? server.bio,
    avatarUrl: cached.avatarUrl ?? server.avatarUrl,
  };
}

function looksRicher(cached: Profile | null, server: Profile): boolean {
  if (!cached || cached.userId !== server.userId) return false;
  if (cached.displayName !== server.displayName && cached.displayName.length >= 2) return true;
  if (cached.handle !== server.handle && cached.handle.length >= 2) return true;
  if ((cached.bio || "") !== (server.bio || "")) return true;
  if (cached.avatarUrl && cached.avatarUrl !== server.avatarUrl) return true;
  return false;
}

export function RequireSignIn({ children }: { children: ReactNode }) {
  const { user, isPending } = useCurrentUserState();
  if (isPending) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-bg">
        <Skeleton className="h-10 w-40 rounded-lg" />
      </div>
    );
  }
  if (!user) return <RedirectToSignIn />;
  return <VerifyGate>{children}</VerifyGate>;
}
