import type { BotMeta, BotSlug } from './types';

// Day-trader-kraken and news-based were archived 2026-04-24 — see
// bots/_archive/README.md and PLAN.md for the consolidation rationale.
// Their BotMeta entries stay here for type/route compatibility on
// historical pages, but BOT_SLUGS only lists active bots, so the
// dashboard renders just the general bot.

export const BOTS: Record<BotSlug, BotMeta> = {
  'general': {
    slug: 'general',
    label: 'General',
    benchmark: 'SPY',
    benchmarkLabel: 'SPY',
    envPrefix: 'GENERAL',
  },
  'day-trader-kraken': {
    slug: 'day-trader-kraken',
    label: 'Day Trader (Kraken) — archived',
    benchmark: 'ITA',
    benchmarkLabel: 'ITA',
    envPrefix: 'KRAKEN',
  },
  'news-based': {
    slug: 'news-based',
    label: 'News — archived',
    benchmark: 'SPY',
    benchmarkLabel: 'SPY',
    envPrefix: 'NEWS',
  },
};

export const BOT_SLUGS: BotSlug[] = ['general'];

export function isBotSlug(v: string): v is BotSlug {
  return v === 'general' || v === 'day-trader-kraken' || v === 'news-based';
}
