// Deterministic mock data so the UI is previewable before any wiring.
// Active whenever Firebase env vars are missing (see lib/config.ts).

import type {
  AlpacaAccount,
  AlpacaPosition,
  BenchmarkRow,
  BotSlug,
  RoutineRun,
  TradeRow,
} from './types';

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function walk(seed: number, days: number, start: number, drift: number, vol: number): number[] {
  const rand = seeded(seed);
  const out: number[] = [];
  let v = start;
  for (let i = 0; i < days; i++) {
    v += v * drift + (rand() - 0.5) * vol * v;
    out.push(Number(v.toFixed(2)));
  }
  return out;
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

const SEED: Record<BotSlug, number> = {
  'general': 11,
  'day-trader-kraken': 37,
  'news-based': 53,
};

const START_EQUITY = 100_000;

export function mockBenchmark(slug: BotSlug, days = 30): BenchmarkRow[] {
  const bot = walk(SEED[slug], days, START_EQUITY, 0.0008, 0.01);
  const bench = walk(SEED[slug] + 100, days, 580, 0.0005, 0.008);
  const benchSymbol = slug === 'day-trader-kraken' ? 'ITA' : 'SPY';
  const rows: BenchmarkRow[] = [];
  for (let i = 0; i < days; i++) {
    const prevEq = i > 0 ? bot[i - 1] : START_EQUITY;
    const prevB = i > 0 ? bench[i - 1] : bench[0];
    const dayPl = ((bot[i] - prevEq) / prevEq) * 100;
    const benchPl = ((bench[i] - prevB) / prevB) * 100;
    rows.push({
      date: daysAgo(days - 1 - i),
      equity: bot[i],
      dayPl,
      benchmark: benchSymbol,
      benchClose: bench[i],
      botVsBench: dayPl - benchPl,
    });
  }
  return rows;
}

export function mockAccount(slug: BotSlug): AlpacaAccount {
  const series = mockBenchmark(slug, 30);
  const eq = series[series.length - 1].equity;
  const lastEq = series[series.length - 2]?.equity ?? eq;
  return {
    equity: eq,
    last_equity: lastEq,
    cash: eq * 0.22,
    buying_power: eq * 0.22,
    daytrade_count: slug === 'day-trader-kraken' ? 2 : 0,
  };
}

const POSITIONS: Record<BotSlug, AlpacaPosition[]> = {
  'general': [
    { symbol: 'MSFT', qty: 12, avg_entry_price: 418.5, current_price: 425.1, market_value: 5101.2, unrealized_pl: 79.2, unrealized_plpc: 0.0157, side: 'long' },
    { symbol: 'GOOGL', qty: 22, avg_entry_price: 170.4, current_price: 173.8, market_value: 3823.6, unrealized_pl: 74.8, unrealized_plpc: 0.0199, side: 'long' },
    { symbol: 'COST', qty: 5, avg_entry_price: 920.0, current_price: 935.2, market_value: 4676.0, unrealized_pl: 76.0, unrealized_plpc: 0.0165, side: 'long' },
  ],
  'day-trader-kraken': [
    { symbol: 'KRKNF', qty: 770, avg_entry_price: 6.51, current_price: 6.68, market_value: 5143.6, unrealized_pl: 130.9, unrealized_plpc: 0.0261, side: 'long' },
  ],
  'news-based': [
    { symbol: 'XLE', qty: 40, avg_entry_price: 93.2, current_price: 94.1, market_value: 3764.0, unrealized_pl: 36.0, unrealized_plpc: 0.0097, side: 'long' },
    { symbol: 'NVDA', qty: 3, avg_entry_price: 880.0, current_price: 895.5, market_value: 2686.5, unrealized_pl: 46.5, unrealized_plpc: 0.0176, side: 'long' },
  ],
};

export function mockPositions(slug: BotSlug): AlpacaPosition[] {
  return POSITIONS[slug];
}

export function mockTrades(slug: BotSlug, days = 30): TradeRow[] {
  const rand = seeded(SEED[slug] + 7);
  const symbols = POSITIONS[slug].map((p) => p.symbol);
  const out: TradeRow[] = [];
  for (let i = days - 1; i >= 0; i--) {
    if (rand() > 0.4) continue;
    const sym = symbols[Math.floor(rand() * symbols.length)];
    out.push({
      timestamp: `${daysAgo(i)}T14:35:00Z`,
      symbol: sym,
      side: rand() > 0.35 ? 'buy' : 'sell',
      qty: Math.max(1, Math.floor(rand() * 50)),
      price: Number((50 + rand() * 900).toFixed(2)),
      orderId: `mock-${i}`,
      thesis: 'mock data',
    });
  }
  return out;
}

export function mockRoutines(slug: BotSlug): RoutineRun[] {
  const base = new Date();
  const routines =
    slug === 'general'
      ? ['general:premarket', 'general:midday', 'general:eod']
      : slug === 'day-trader-kraken'
      ? ['kraken:plan', 'kraken:execute', 'kraken:eod']
      : ['news:scan', 'news:execute', 'news:eod'];
  return routines.map((r, i) => {
    const d = new Date(base.getTime() - (i + 1) * 45 * 60 * 1000);
    return {
      routine: r,
      lastRunISO: d.toISOString(),
      commitSha: `mock${i}a`,
      success: true,
    };
  });
}
