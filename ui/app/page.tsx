'use client';

import { useEffect, useMemo, useState } from 'react';
import { BOT_SLUGS, BOTS } from '@/lib/bots';
import type {
  AlpacaAccount,
  BenchmarkRow,
  BotHealth,
  BotSlug,
  MemoryParseResponse,
  RoutineRun,
} from '@/lib/types';
import { authFetchJSON } from '@/lib/auth-fetch';
import { BotCard } from '@/components/BotCard';
import { RoutineHealthStrip } from '@/components/RoutineHealthStrip';
import { ErrorBanner, type BannerItem } from '@/components/ErrorBanner';

interface BotState {
  account: AlpacaAccount | null;
  history: BenchmarkRow[];
  routines: RoutineRun[];
  health: BotHealth;
  errors: BannerItem[];
}

const EMPTY_STATE: BotState = {
  account: null,
  history: [],
  routines: [],
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

async function loadBot(slug: BotSlug): Promise<BotState> {
  const errors: BannerItem[] = [];
  const [acctRes, histRes, routRes] = await Promise.all([
    authFetchJSON<AlpacaAccount>(`/api/alpaca/${slug}/account`),
    authFetchJSON<MemoryParseResponse<BenchmarkRow>>(`/api/memory/${slug}/benchmark.md`),
    authFetchJSON<RoutineRun[]>(`/api/memory/${slug}/routines.json`),
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
  return {
    account,
    history,
    routines,
    errors,
    health: classifyHealth(account, routines, errors),
  };
}

export default function Dashboard() {
  const [state, setState] = useState<Record<string, BotState> | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  useEffect(() => {
    let cancelled = false;
    async function refresh() {
      const entries = await Promise.all(
        BOT_SLUGS.map(async (slug) => [slug, await loadBot(slug)] as const),
      );
      if (cancelled) return;
      setState(Object.fromEntries(entries));
      setLastRefresh(new Date());
    }
    refresh();
    const id = setInterval(refresh, 60_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const isLoading = state === null;
  const effectiveState = state ?? Object.fromEntries(BOT_SLUGS.map((s) => [s, EMPTY_STATE]));

  const combinedEquity = BOT_SLUGS.reduce(
    (sum, s) => sum + (effectiveState[s]?.account?.equity ?? 0),
    0,
  );
  const combinedLast = BOT_SLUGS.reduce(
    (sum, s) => sum + (effectiveState[s]?.account?.last_equity ?? 0),
    0,
  );
  const combinedPct = combinedLast > 0 ? ((combinedEquity - combinedLast) / combinedLast) * 100 : 0;

  const allErrors = useMemo<BannerItem[]>(() => {
    if (!state) return [];
    return BOT_SLUGS.flatMap((s) => state[s]?.errors ?? []);
  }, [state]);

  const botCount = BOT_SLUGS.filter((s) => effectiveState[s]?.account !== null).length;

  return (
    <main className="max-w-3xl mx-auto p-4 space-y-4">
      <header className="flex items-baseline justify-between pb-2 border-b border-border">
        <div>
          <h1 className="text-lg font-semibold">Trader</h1>
          <p className="text-xs text-muted">
            {isLoading ? 'loading…' : `${botCount} of ${BOT_SLUGS.length} bots · read-only`}
          </p>
        </div>
        <div className="text-right">
          <div className="num text-lg">
            {isLoading ? '—' : `$${combinedEquity.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          </div>
          {!isLoading && (
            <div
              className={`num text-xs ${combinedPct >= 0 ? 'text-up' : 'text-down'}`}
            >
              {combinedPct >= 0 ? '+' : ''}
              {combinedPct.toFixed(2)}% today
            </div>
          )}
          <div className="text-[10px] text-muted mt-1">
            {lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
        </div>
      </header>

      {allErrors.length > 0 && <ErrorBanner items={allErrors} />}

      {BOT_SLUGS.map((slug) => (
        <BotCard
          key={slug}
          bot={BOTS[slug]}
          state={effectiveState[slug]}
          spyHistory={effectiveState['general']?.history}
        />
      ))}

      <RoutineHealthStrip state={effectiveState} />
    </main>
  );
}
