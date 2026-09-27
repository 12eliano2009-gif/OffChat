import { createFileRoute } from "@tanstack/react-router";
import { AppFrame } from "@/components/offx/app-frame";
import { Inbox } from "@/components/offx/inbox";
import { RequireSignIn } from "@/components/offx/signed-in";

export const Route = createFileRoute("/messages")({ component: MessagesPage });

function MessagesPage() {
  return (
    <RequireSignIn>
      <AppFrame>
        <div className="mx-auto flex min-h-[calc(100dvh-3rem)] max-w-lg flex-col tab-safe lg:min-h-dvh">
          <Inbox />
        </div>
      </AppFrame>
    </RequireSignIn>
  );
}
