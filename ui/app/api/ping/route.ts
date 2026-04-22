import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Minimal probe endpoint. If GET /api/ping returns 200 with ok:true but
// /api/health still 404s, the problem is specifically with the /api/health
// path (e.g. CDN-cached 404 from before the route existed). If BOTH 404,
// Firebase Hosting has no /api/** rewrite at all — a firebase.json issue.
// If both return 200, the UI's other API calls (alpaca, memory) are
// failing for a different reason and DevTools Network tab will show it.
export async function GET(req: Request): Promise<Response> {
  console.log(`[ping] ${new Date().toISOString()} ${req.method} ${req.url} rev=${process.env.K_REVISION ?? '?'}`);
  return NextResponse.json(
    {
      ok: true,
      at: new Date().toISOString(),
      revision: process.env.K_REVISION ?? null,
      service: process.env.K_SERVICE ?? null,
    },
    { headers: { 'Cache-Control': 'no-store, max-age=0' } },
  );
}
