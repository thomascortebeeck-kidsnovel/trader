'use client';

import { useEffect, useState } from 'react';
import { BOT_SLUGS, BOTS } from '@/lib/bots';
import type { AlpacaAccount, BenchmarkRow, RoutineRun } from '@/lib/types';
import { authFetch } from '@/lib/auth-fetch';
import { BotCard } from '@/components/BotCard';
import { RoutineHealthStrip } from '@/components/RoutineHealthStrip';

interface BotState {
  account: AlpacaAccount | null;
  history: BenchmarkRow[];
  routines: RoutineRun[];
}

async function loadBot(slug: string): Promise<BotState> {
  const [acctRes, histRes, routRes] = await Promise.all([
    authFetch(`/api/alpaca/${slug}/account`),
    authFetch(`/api/memory/${slug}/benchmark.md`),
    authFetch(`/api/memory/${slug}/routines.json`),
  ]);
  const account = acctRes.ok ? ((await acctRes.json()) as AlpacaAccount) : null;
  const history = histRes.ok ? ((await histRes.json()) as BenchmarkRow[]) : [];
  const routines = routRes.ok ? ((await routRes.json()) as RoutineRun[]) : [];
  return { account, history, routines };
}

export default function Dashboard() {
  const [state, setState] = useState<Record<string, BotState>>({});
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

  const combinedEquity = BOT_SLUGS.reduce(
    (sum, s) => sum + (state[s]?.account?.equity ?? 0),
    0,
  );
  const combinedLast = BOT_SLUGS.reduce(
    (sum, s) => sum + (state[s]?.account?.last_equity ?? 0),
    0,
  );
  const combinedPct = combinedLast > 0 ? ((combinedEquity - combinedLast) / combinedLast) * 100 : 0;

  return (
    <main className="max-w-3xl mx-auto p-4 space-y-4">
      <header className="flex items-baseline justify-between pb-2 border-b border-border">
        <div>
          <h1 className="text-lg font-semibold">Trader</h1>
          <p className="text-xs text-muted">3 bots · read-only</p>
        </div>
        <div className="text-right">
          <div className="num text-lg">
            ${combinedEquity.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
          <div
            className={`num text-xs ${combinedPct >= 0 ? 'text-up' : 'text-down'}`}
          >
            {combinedPct >= 0 ? '+' : ''}
            {combinedPct.toFixed(2)}% today
          </div>
          <div className="text-[10px] text-muted mt-1">
            {lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
        </div>
      </header>

      {BOT_SLUGS.map((slug) => (
        <BotCard key={slug} bot={BOTS[slug]} state={state[slug]} />
      ))}

      <RoutineHealthStrip state={state} />
    </main>
  );
}
