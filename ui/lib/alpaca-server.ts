// Server-only. Never import from client components.
// Keys are read from server env vars (no NEXT_PUBLIC_ prefix), so they
// never end up in the client bundle.
//
// TODO (before live trading): verify the Firebase ID token on every call
// here. Use firebase-admin's verifyIdToken. For MVP (paper only, private
// dashboard), the Firebase Auth gate on the client pages is our only guard.

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
  if (!creds) throw new Error(`Alpaca keys missing for ${slug}`);
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      'APCA-API-KEY-ID': creds.key,
      'APCA-API-SECRET-KEY': creds.secret,
    },
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`Alpaca ${path} failed: ${res.status} ${await res.text()}`);
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
