export type BotSlug = 'general' | 'day-trader-kraken' | 'news-based';

export interface BotMeta {
  slug: BotSlug;
  label: string;
  benchmark: string;
  benchmarkLabel: string;
  envPrefix: 'GENERAL' | 'KRAKEN' | 'NEWS';
}

export interface AlpacaAccount {
  equity: number;
  last_equity: number;
  cash: number;
  buying_power: number;
  daytrade_count: number;
}

export interface AlpacaPosition {
  symbol: string;
  qty: number;
  avg_entry_price: number;
  current_price: number;
  market_value: number;
  unrealized_pl: number;
  unrealized_plpc: number;
  side: 'long' | 'short';
}

export interface TradeRow {
  timestamp: string;
  symbol: string;
  side: 'buy' | 'sell';
  qty: number;
  price: number;
  orderId: string;
  thesis: string;
}

export interface BenchmarkRow {
  date: string;
  equity: number;
  dayPl: number;
  benchmark: string;
  benchClose: number;
  botVsBench: number;
}

export interface RoutineRun {
  routine: string;
  lastRunISO: string;
  commitSha: string;
  success: boolean;
}

export interface ParseError {
  line: number;
  reason: string;
}

// Shape of /api/memory/{bot}/benchmark.md and /trade-log.md responses.
export interface MemoryParseResponse<T> {
  rows: T[];
  errors: ParseError[];
}

export type BotHealth = 'ok' | 'stale' | 'warn' | 'credentials_missing' | 'unknown';
