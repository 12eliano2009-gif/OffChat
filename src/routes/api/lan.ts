import { createFileRoute } from "@tanstack/react-router";
import { handleLanBus } from "@/lib/offx/lan-bus.server";

const handle = ({ request }: { request: Request }) => handleLanBus(request);

export const Route = createFileRoute("/api/lan")({
  server: { handlers: { GET: handle, POST: handle } },
});
