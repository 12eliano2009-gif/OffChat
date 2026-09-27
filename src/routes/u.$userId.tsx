import { createFileRoute } from "@tanstack/react-router";
import { AppFrame } from "@/components/offx/app-frame";
import { ProfileView } from "@/components/offx/profile-view";
import { RequireSignIn } from "@/components/offx/signed-in";

export const Route = createFileRoute("/u/$userId")({ component: UserPage });

function UserPage() {
  const { userId } = Route.useParams();
  return (
    <RequireSignIn>
      <AppFrame>
        <ProfileView userId={userId} />
      </AppFrame>
    </RequireSignIn>
  );
}
