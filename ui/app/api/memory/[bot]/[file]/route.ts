import { NextResponse } from 'next/server';
import { isBotSlug } from '@/lib/bots';
import { USE_MOCK } from '@/lib/config';
import { fetchMemoryFile, fetchRoutineCommits } from '@/lib/github-server';
import { mockBenchmark, mockRoutines, mockTrades } from '@/lib/mock-data';
import { parseBenchmark } from '@/lib/parsers/benchmark';
import { parseTradeLog } from '@/lib/parsers/trade-log';

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
  _req: Request,
  ctx: { params: Promise<{ bot: string; file: string }> },
) {
  const { bot, file } = await ctx.params;
  if (!isBotSlug(bot)) {
    return NextResponse.json({ error: 'unknown bot' }, { status: 404 });
  }
  if (file === 'routines.json') {
    const data = USE_MOCK ? mockRoutines(bot) : await fetchRoutineCommits(bot);
    return NextResponse.json(data);
  }
  if (!ALLOWED_FILES.has(file)) {
    return NextResponse.json({ error: 'file not allowed' }, { status: 403 });
  }
  try {
    if (USE_MOCK) {
      if (file === 'benchmark.md') return NextResponse.json(mockBenchmark(bot));
      if (file === 'trade-log.md') return NextResponse.json(mockTrades(bot));
      return NextResponse.json({ error: 'mock not implemented for ' + file }, { status: 501 });
    }
    const md = await fetchMemoryFile(bot, file);
    if (file === 'benchmark.md') return NextResponse.json(parseBenchmark(md));
    if (file === 'trade-log.md') return NextResponse.json(parseTradeLog(md));
    return new NextResponse(md, { headers: { 'Content-Type': 'text/markdown' } });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 });
  }
}
