import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/wallet")({ component: WalletRedirect });

function WalletRedirect() {
  return <Navigate to="/online" />;
}
