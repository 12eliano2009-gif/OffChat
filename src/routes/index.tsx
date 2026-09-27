import { createFileRoute, useRouterState } from "@tanstack/react-router";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { AppFrame } from "@/components/offx/app-frame";
import { Feed } from "@/components/offx/feed";
import { Landing } from "@/components/offx/landing";
import { VerifyGate } from "@/components/offx/signed-in";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const cookieUser = useRouterState({
    select: (s) => {
      const match = s.matches.find((m) => m.routeId === "__root__");
      const ctx = match?.context as { sessionUser?: { id: string } | null } | undefined;
      return ctx?.sessionUser ?? null;
    },
  });
  const { user, isPending } = useCurrentUserState();

  if (user) {
    return (
      <VerifyGate>
        <AppFrame>
          <Feed />
        </AppFrame>
      </VerifyGate>
    );
  }

  if (isPending && cookieUser) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-bg">
        <Skeleton className="h-12 w-36 rounded-lg" />
      </main>
    );
  }

  return <Landing />;
}
