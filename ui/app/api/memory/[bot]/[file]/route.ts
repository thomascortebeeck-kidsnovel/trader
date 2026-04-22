import { NextResponse } from 'next/server';
import { apiError, handleApiError } from '@/lib/api-errors';
import { isBotSlug } from '@/lib/bots';
import { USE_MOCK } from '@/lib/config';
import { requireAuthenticatedUser } from '@/lib/firebase-admin';
import { fetchMemoryFile, fetchRoutineCommits } from '@/lib/github-server';
import { mockBenchmark, mockRoutines, mockTrades } from '@/lib/mock-data';
import { parseBenchmarkDetailed } from '@/lib/parsers/benchmark';
import { parseTradeLogDetailed } from '@/lib/parsers/trade-log';

export const runtime = 'nodejs';

const ALLOWED_FILES = new Set([
  'benchmark.md',
  'trade-log.md',
  'reasoning.md',
  'strategy.md',
  'weekly-review.md',
  'research-log.md',
  'routines.json',
]);

export async function GET(
  req: Request,
  ctx: { params: Promise<{ bot: string; file: string }> },
) {
  const { bot, file } = await ctx.params;
  try {
    await requireAuthenticatedUser(req);
    if (!isBotSlug(bot)) return apiError('not_found', `unknown bot ${bot}`);
    if (file !== 'routines.json' && !ALLOWED_FILES.has(file)) {
      return apiError('bad_request', `file '${file}' not allowed`);
    }

    if (file === 'routines.json') {
      const data = USE_MOCK ? mockRoutines(bot) : await fetchRoutineCommits(bot);
      return NextResponse.json(data);
    }

    if (USE_MOCK) {
      if (file === 'benchmark.md') return NextResponse.json({ rows: mockBenchmark(bot), errors: [] });
      if (file === 'trade-log.md') return NextResponse.json({ rows: mockTrades(bot), errors: [] });
      return apiError('bad_request', `mock not implemented for ${file}`);
    }

    const result = await fetchMemoryFile(bot, file);

    // File genuinely doesn't exist yet (fresh bot). Return empty, not an error.
    if (result.content === null) {
      if (file === 'benchmark.md' || file === 'trade-log.md') {
        return NextResponse.json({ rows: [], errors: [] });
      }
      return new NextResponse('', {
        headers: { 'Content-Type': 'text/markdown' },
      });
    }

    if (file === 'benchmark.md') return NextResponse.json(parseBenchmarkDetailed(result.content));
    if (file === 'trade-log.md') return NextResponse.json(parseTradeLogDetailed(result.content));
    return new NextResponse(result.content, {
      headers: { 'Content-Type': 'text/markdown' },
    });
  } catch (err) {
    return handleApiError(err, `memory/${bot}/${file}`);
  }
}
