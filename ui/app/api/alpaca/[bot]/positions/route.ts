import { NextResponse } from 'next/server';
import { isBotSlug } from '@/lib/bots';
import { USE_MOCK } from '@/lib/config';
import { mockPositions } from '@/lib/mock-data';
import { getPositions } from '@/lib/alpaca-server';

export const runtime = 'nodejs';

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ bot: string }> },
) {
  const { bot } = await ctx.params;
  if (!isBotSlug(bot)) {
    return NextResponse.json({ error: 'unknown bot' }, { status: 404 });
  }
  try {
    const data = USE_MOCK ? mockPositions(bot) : await getPositions(bot);
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 });
  }
}
