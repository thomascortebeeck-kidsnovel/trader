import { NextResponse } from 'next/server';
import { apiError, handleApiError } from '@/lib/api-errors';
import { isBotSlug } from '@/lib/bots';
import { USE_MOCK } from '@/lib/config';
import { requireAuthenticatedUser } from '@/lib/firebase-admin';
import { mockAccount } from '@/lib/mock-data';
import { getAccount } from '@/lib/alpaca-server';

export const runtime = 'nodejs';

export async function GET(
  req: Request,
  ctx: { params: Promise<{ bot: string }> },
) {
  const { bot } = await ctx.params;
  try {
    await requireAuthenticatedUser(req);
    if (!isBotSlug(bot)) return apiError('not_found', `unknown bot ${bot}`);
    const data = USE_MOCK ? mockAccount(bot) : await getAccount(bot);
    return NextResponse.json(data);
  } catch (err) {
    return handleApiError(err, `alpaca/account/${bot}`);
  }
}
