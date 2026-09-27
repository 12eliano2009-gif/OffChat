import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { AuthForm } from "@/components/offx/auth-form";
import { InstallButton } from "@/components/offx/install";
import { OffxLockup } from "@/components/offx/logo";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const { user, isPending } = useCurrentUserState();
  if (isPending) {
    return (
      <main className="grid min-h-dvh place-items-center bg-bg">
        <Skeleton className="h-12 w-40 rounded-lg" />
      </main>
    );
  }
  if (user) return <Navigate to="/" />;
  return (
    <main className="grid min-h-dvh place-items-center bg-bg px-5 py-10">
      <div className="w-full max-w-sm space-y-6">
        <OffxLockup />
        <div>
          <h1 className="text-xl font-medium">Anmelden</h1>
          <p className="mt-1 text-sm text-muted">
            Google oder E-Mail. Danach läuft Offchat im lokalen Netz — Café, WG,
            privates WLAN.
          </p>
        </div>
        <AuthForm />
        <InstallButton />
        <Link to="/get" className="block text-center text-sm text-muted underline-offset-4 hover:underline">
          App herunterladen
        </Link>
      </div>
    </main>
  );
}
