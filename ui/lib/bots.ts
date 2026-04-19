import type { BotMeta, BotSlug } from './types';

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
    label: 'Day Trader (Kraken)',
    benchmark: 'ITA',
    benchmarkLabel: 'ITA',
    envPrefix: 'KRAKEN',
  },
  'news-based': {
    slug: 'news-based',
    label: 'News',
    benchmark: 'SPY',
    benchmarkLabel: 'SPY',
    envPrefix: 'NEWS',
  },
};

export const BOT_SLUGS: BotSlug[] = ['general', 'day-trader-kraken', 'news-based'];

export function isBotSlug(v: string): v is BotSlug {
  return (BOT_SLUGS as string[]).includes(v);
}
