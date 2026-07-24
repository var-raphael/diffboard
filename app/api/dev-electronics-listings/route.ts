// app/api/dev-electronics-listings/route.ts
// Server-side proxy for the Quorel dev-electronics-listings dataset.
// Runs on the Next.js server, so it isn't subject to browser CORS.

const UPSTREAM =
  "https://quorel.vercel.app/api/2/dev-electronics-listings/active/";

export async function GET() {
  try {
    const res = await fetch(UPSTREAM, { cache: "no-store" });

    if (!res.ok) {
      return Response.json(
        { error: `Upstream request failed (${res.status})` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return Response.json(data);
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Upstream fetch failed" },
      { status: 502 }
    );
  }
}
