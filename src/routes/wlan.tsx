import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/wlan")({ component: WlanRedirect });

function WlanRedirect() {
  return <Navigate to="/" />;
}
