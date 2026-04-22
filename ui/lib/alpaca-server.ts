// Server-only. Never import from client components.
// Keys are read from server env vars (no NEXT_PUBLIC_ prefix), so they
// never end up in the client bundle.
//
// ID-token verification happens in the API route handlers
// (via requireAuthenticatedUser), not here, so this module stays
// focused on Alpaca I/O.

import { ApiError } from './api-errors';
import { BOTS } from './bots';
import type { AlpacaAccount, AlpacaPosition, BotSlug } from './types';

const BASE = process.env.ALPACA_BASE_URL ?? 'https://paper-api.alpaca.markets';

function keysForBot(slug: BotSlug): { key: string; secret: string } | null {
  const prefix = BOTS[slug].envPrefix;
  const key = process.env[`${prefix}_ALPACA_API_KEY`];
  const secret = process.env[`${prefix}_ALPACA_SECRET_KEY`];
  if (!key || !secret) return null;
  return { key, secret };
}

async function alpacaGet<T>(slug: BotSlug, path: string): Promise<T> {
  const creds = keysForBot(slug);
  if (!creds) {
    throw new ApiError(
      'credentials_missing',
      `Alpaca keys not set for ${slug} (need ${BOTS[slug].envPrefix}_ALPACA_API_KEY + _SECRET_KEY)`,
    );
  }
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      'APCA-API-KEY-ID': creds.key,
      'APCA-API-SECRET-KEY': creds.secret,
    },
    cache: 'no-store',
  });
  if (res.status === 401 || res.status === 403) {
    throw new ApiError(
      'upstream_auth',
      `Alpaca rejected credentials for ${slug}: ${res.status}`,
    );
  }
  if (!res.ok) {
    throw new ApiError('upstream_down', `Alpaca ${path} failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

type RawAccount = {
  equity: string;
  last_equity: string;
  cash: string;
  buying_power: string;
  daytrade_count: number;
};

type RawPosition = {
  symbol: string;
  qty: string;
  avg_entry_price: string;
  current_price: string;
  market_value: string;
  unrealized_pl: string;
  unrealized_plpc: string;
  side: 'long' | 'short';
};

export async function getAccount(slug: BotSlug): Promise<AlpacaAccount> {
  const raw = await alpacaGet<RawAccount>(slug, '/v2/account');
  return {
    equity: Number(raw.equity),
    last_equity: Number(raw.last_equity),
    cash: Number(raw.cash),
    buying_power: Number(raw.buying_power),
    daytrade_count: raw.daytrade_count,
  };
}

export async function getPositions(slug: BotSlug): Promise<AlpacaPosition[]> {
  const raw = await alpacaGet<RawPosition[]>(slug, '/v2/positions');
  return raw.map((p) => ({
    symbol: p.symbol,
    qty: Number(p.qty),
    avg_entry_price: Number(p.avg_entry_price),
    current_price: Number(p.current_price),
    market_value: Number(p.market_value),
    unrealized_pl: Number(p.unrealized_pl),
    unrealized_plpc: Number(p.unrealized_plpc),
    side: p.side,
  }));
}
