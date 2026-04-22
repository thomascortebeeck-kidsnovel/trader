'use client';

import { useEffect, useMemo, useState } from 'react';
import { BOT_SLUGS, BOTS } from '@/lib/bots';
import type {
  AlpacaAccount,
  AlpacaPosition,
  BenchmarkRow,
  BotHealth,
  BotSlug,
  MemoryParseResponse,
  RoutineRun,
  TradeRow,
} from '@/lib/types';
import { authFetchJSON } from '@/lib/auth-fetch';
import { filterRowsByET } from '@/lib/parsers/trade-log';
import { isoTodayET } from '@/lib/format';
import { BotCard } from '@/components/BotCard';
import { HeroCombinedCard } from '@/components/HeroCombinedCard';
import { NavHeader } from '@/components/NavHeader';
import { RoutineHealthStrip } from '@/components/RoutineHealthStrip';
import { ErrorBanner, type BannerItem } from '@/components/ErrorBanner';

const REFRESH_MS = 60_000;

interface BotState {
  account: AlpacaAccount | null;
  history: BenchmarkRow[];
  routines: RoutineRun[];
  positions: AlpacaPosition[];
  tradesToday: number;
  health: BotHealth;
  errors: BannerItem[];
}

const EMPTY_STATE: BotState = {
  account: null,
  history: [],
  routines: [],
  positions: [],
  tradesToday: 0,
  health: 'unknown',
  errors: [],
};

function classifyHealth(
  account: AlpacaAccount | null,
  routines: RoutineRun[],
  errors: BannerItem[],
): BotHealth {
  if (errors.some((e) => e.message.includes('credentials_missing') || e.message.includes('Alpaca keys'))) {
    return 'credentials_missing';
  }
  if (!account) return 'credentials_missing';
  const latest = routines[0];
  if (!latest) return 'unknown';
  const ageMins = (Date.now() - new Date(latest.lastRunISO).getTime()) / 60_000;
  if (ageMins < 120) return 'ok';
  if (ageMins < 480) return 'warn';
  return 'stale';
}

async function loadBot(slug: BotSlug, todayET: string): Promise<BotState> {
  const errors: BannerItem[] = [];
  const [acctRes, histRes, routRes, posRes, tradesRes] = await Promise.all([
    authFetchJSON<AlpacaAccount>(`/api/alpaca/${slug}/account`),
    authFetchJSON<MemoryParseResponse<BenchmarkRow>>(`/api/memory/${slug}/benchmark.md`),
    authFetchJSON<RoutineRun[]>(`/api/memory/${slug}/routines.json`),
    authFetchJSON<AlpacaPosition[]>(`/api/alpaca/${slug}/positions`),
    authFetchJSON<MemoryParseResponse<TradeRow>>(`/api/memory/${slug}/trade-log.md`),
  ]);

  if (!acctRes.ok && acctRes.error) {
    errors.push({
      severity: acctRes.error.code === 'credentials_missing' ? 'warn' : 'error',
      source: `${slug} · account`,
      message: `${acctRes.error.code}: ${acctRes.error.message}`,
    });
  }
  if (!histRes.ok && histRes.error) {
    errors.push({
      severity: 'error',
      source: `${slug} · benchmark.md`,
      message: `${histRes.error.code}: ${histRes.error.message}`,
    });
  }
  if (!routRes.ok && routRes.error) {
    errors.push({
      severity: 'error',
      source: `${slug} · routines`,
      message: `${routRes.error.code}: ${routRes.error.message}`,
    });
  }
  if (!posRes.ok && posRes.error) {
    errors.push({
      severity: posRes.error.code === 'credentials_missing' ? 'warn' : 'error',
      source: `${slug} · positions`,
      message: `${posRes.error.code}: ${posRes.error.message}`,
    });
  }
  if (histRes.ok && histRes.data?.errors?.length) {
    for (const e of histRes.data.errors) {
      errors.push({
        severity: 'warn',
        source: `${slug} · benchmark.md line ${e.line}`,
        message: e.reason,
      });
    }
  }

  const history = histRes.data?.rows ?? [];
  const routines = routRes.data ?? [];
  const account = acctRes.data;
  const positions = posRes.data ?? [];
  const tradeRows = tradesRes.data?.rows ?? [];
  const tradesToday = filterRowsByET(tradeRows, todayET).length;

  return {
    account,
    history,
    routines,
    positions,
    tradesToday,
    errors,
    health: classifyHealth(account, routines, errors),
  };
}

export default function Dashboard() {
  const [state, setState] = useState<Record<BotSlug, BotState> | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  useEffect(() => {
    let cancelled = false;
    async function refresh() {
      const today = isoTodayET();
      const entries = await Promise.all(
        BOT_SLUGS.map(async (slug) => [slug, await loadBot(slug, today)] as const),
      );
      if (cancelled) return;
      setState(Object.fromEntries(entries) as Record<BotSlug, BotState>);
      setLastRefresh(new Date());
    }
    refresh();
    const id = setInterval(refresh, REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const isLoading = state === null;
  const effectiveState = (state ?? (Object.fromEntries(BOT_SLUGS.map((s) => [s, EMPTY_STATE])) as Record<BotSlug, BotState>));

  const allErrors = useMemo<BannerItem[]>(() => {
    if (!state) return [];
    return BOT_SLUGS.flatMap((s) => state[s]?.errors ?? []);
  }, [state]);

  return (
    <main className="max-w-5xl mx-auto p-4 space-y-5">
      <NavHeader />

      <HeroCombinedCard
        state={effectiveState}
        lastRefresh={lastRefresh}
        refreshIntervalMs={REFRESH_MS}
        isLoading={isLoading}
      />

      {allErrors.length > 0 && <ErrorBanner items={allErrors} />}

      <section className="grid gap-3 md:grid-cols-3">
        {BOT_SLUGS.map((slug) => (
          <BotCard
            key={slug}
            bot={BOTS[slug]}
            state={effectiveState[slug]}
            spyHistory={effectiveState['general']?.history}
          />
        ))}
      </section>

      <RoutineHealthStrip state={effectiveState} />
    </main>
  );
}
