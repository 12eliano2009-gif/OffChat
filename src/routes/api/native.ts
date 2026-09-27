import { createFileRoute } from "@tanstack/react-router";
import { packNative, publicOrigin } from "@/lib/offx/native-pack.server";

async function handle({ request }: { request: Request }) {
  const url = new URL(request.url);
  const kind = url.searchParams.get("kind") === "exe" ? "exe" : "apk";
  try {
    const origin = publicOrigin(request);
    const file = await packNative(kind, origin);
    return new Response(new Uint8Array(file.bytes), {
      headers: {
        "content-type": file.type,
        "content-disposition": `attachment; filename="${file.filename}"`,
        "cache-control": "no-store",
      },
    });
  } catch {
    return new Response("not found", { status: 404 });
  }
}

export const Route = createFileRoute("/api/native")({
  server: { handlers: { GET: handle } },
});
