import { createFileRoute } from "@tanstack/react-router";
import { AppFrame } from "@/components/offx/app-frame";
import { ProfileView } from "@/components/offx/profile-view";
import { RequireSignIn } from "@/components/offx/signed-in";

export const Route = createFileRoute("/profile")({ component: ProfilePage });

function ProfilePage() {
  return (
    <RequireSignIn>
      <AppFrame>
        <ProfileView />
      </AppFrame>
    </RequireSignIn>
  );
}
