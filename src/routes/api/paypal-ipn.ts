import { createFileRoute } from "@tanstack/react-router";
import { handlePaypalIpn } from "@/lib/offx/paypal.server";

const handle = ({ request }: { request: Request }) => handlePaypalIpn(request);

export const Route = createFileRoute("/api/paypal-ipn")({
  server: { handlers: { GET: handle, POST: handle } },
});
