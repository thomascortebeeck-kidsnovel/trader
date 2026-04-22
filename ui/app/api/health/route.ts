import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Diagnostic endpoint. Reports WHICH env vars are present on the Cloud Run
// revision serving this request. Never returns values — only presence and
// string length, so a malformed secret ref (e.g. `***`) is still visible as
// length=0 or length=3 without leaking the actual key.
//
// Hit GET /api/health from the deployed dashboard. Expected shape on a
// healthy deploy:
//   { ok: true, env: { GENERAL_ALPACA_API_KEY: { present: true, len: 20 }, ... } }
//
// If something is missing or empty, the offending key shows { present: false }
// (env var absent) or { present: true, len: 0 } (set but empty). That tells us
// whether the `gcloud --set-secrets` / `--update-env-vars` step actually
// landed on the serving revision.

const REQUIRED_KEYS = [
  // Plain env vars set via --update-env-vars
  'GITHUB_REPO_OWNER',
  'GITHUB_REPO_NAME',
  'GITHUB_REPO_BRANCH',
  'ALPACA_BASE_URL',
  'ALPACA_DATA_URL',
  // Secrets mounted via --set-secrets
  'GENERAL_ALPACA_API_KEY',
  'GENERAL_ALPACA_SECRET_KEY',
  'KRAKEN_ALPACA_API_KEY',
  'KRAKEN_ALPACA_SECRET_KEY',
  'NEWS_ALPACA_API_KEY',
  'NEWS_ALPACA_SECRET_KEY',
  'GITHUB_TOKEN',
] as const;

export async function GET(req: Request): Promise<Response> {
  console.log(`[health] ${new Date().toISOString()} ${req.method} ${req.url} rev=${process.env.K_REVISION ?? '?'}`);

  const env: Record<string, { present: boolean; len: number }> = {};
  for (const k of REQUIRED_KEYS) {
    const v = process.env[k];
    env[k] = { present: typeof v === 'string', len: typeof v === 'string' ? v.length : 0 };
  }

  const kService = process.env.K_SERVICE;
  const kRevision = process.env.K_REVISION;
  const nodeEnv = process.env.NODE_ENV;

  const allPresent = REQUIRED_KEYS.every((k) => env[k].present && env[k].len > 0);

  return NextResponse.json(
    {
      ok: allPresent,
      cloudRun: {
        service: kService ?? null,
        revision: kRevision ?? null,
      },
      nodeEnv: nodeEnv ?? null,
      env,
    },
    { headers: { 'Cache-Control': 'no-store, max-age=0' } },
  );
}
