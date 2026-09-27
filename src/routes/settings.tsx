import { createFileRoute } from "@tanstack/react-router";
import { AppFrame } from "@/components/offx/app-frame";
import { SettingsView } from "@/components/offx/settings-view";
import { RequireSignIn } from "@/components/offx/signed-in";

export const Route = createFileRoute("/settings")({ component: SettingsPage });

function SettingsPage() {
  return (
    <RequireSignIn>
      <AppFrame>
        <SettingsView />
      </AppFrame>
    </RequireSignIn>
  );
}
