import { createFileRoute } from "@tanstack/react-router";
import { AppFrame } from "@/components/offx/app-frame";
import { CreatePost } from "@/components/offx/create-post";
import { RequireSignIn } from "@/components/offx/signed-in";

export const Route = createFileRoute("/create")({ component: CreatePage });

function CreatePage() {
  return (
    <RequireSignIn>
      <AppFrame>
        <CreatePost />
      </AppFrame>
    </RequireSignIn>
  );
}
