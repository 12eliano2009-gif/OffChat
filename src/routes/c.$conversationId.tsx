import { createFileRoute } from "@tanstack/react-router";
import { AppFrame } from "@/components/offx/app-frame";
import { Inbox } from "@/components/offx/inbox";
import { RequireSignIn } from "@/components/offx/signed-in";
import { Thread } from "@/components/offx/thread";

export const Route = createFileRoute("/c/$conversationId")({ component: ChatPage });

function ChatPage() {
  const { conversationId } = Route.useParams();
  return (
    <RequireSignIn>
      <AppFrame hideChrome>
        <div className="flex h-dvh min-h-0">
          <div className="hidden w-80 shrink-0 border-r border-border lg:block">
            <Inbox activeId={conversationId} />
          </div>
          <div className="min-w-0 flex-1">
            <Thread conversationId={conversationId} />
          </div>
        </div>
      </AppFrame>
    </RequireSignIn>
  );
}
