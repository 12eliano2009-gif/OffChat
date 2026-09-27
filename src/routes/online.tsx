import { createFileRoute } from "@tanstack/react-router";
import { AppFrame } from "@/components/offx/app-frame";
import { OnlineView } from "@/components/offx/online-view";
import { RequireSignIn } from "@/components/offx/signed-in";

export const Route = createFileRoute("/online")({ component: OnlinePage });

function OnlinePage() {
  return (
    <RequireSignIn>
      <AppFrame>
        <OnlineView />
      </AppFrame>
    </RequireSignIn>
  );
}
