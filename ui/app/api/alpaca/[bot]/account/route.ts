import { NextResponse } from 'next/server';
import { isBotSlug } from '@/lib/bots';
import { USE_MOCK } from '@/lib/config';
import { mockAccount } from '@/lib/mock-data';
import { getAccount } from '@/lib/alpaca-server';

export const runtime = 'nodejs';

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ bot: string }> },
) {
  const { bot } = await ctx.params;
  console.log(`[alpaca/account] bot=${bot} mock=${USE_MOCK} rev=${process.env.K_REVISION ?? '?'}`);
  if (!isBotSlug(bot)) {
    return NextResponse.json({ error: 'unknown bot' }, { status: 404 });
  }
  try {
    const data = USE_MOCK ? mockAccount(bot) : await getAccount(bot);
    return NextResponse.json(data);
  } catch (err) {
    console.error(`[alpaca/account] bot=${bot} error:`, err);
    return NextResponse.json({ error: String(err) }, { status: 502 });
  }
}
