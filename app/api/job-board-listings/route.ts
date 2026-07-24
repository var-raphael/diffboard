// app/api/job-board-listings/route.ts
// Server-side proxy for the Quorel job-board-listings dataset.
// Runs on the Next.js server, so it isn't subject to browser CORS —
// the client fetches THIS route instead of quorel.vercel.app directly.

const UPSTREAM =
  "https://quorel.vercel.app/api/1/job-board-listings/active/";

export async function GET() {
  try {
    const res = await fetch(UPSTREAM, {
      // avoid caching stale data between refresh clicks
      cache: "no-store",
    });

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
