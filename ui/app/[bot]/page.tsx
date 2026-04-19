'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BOTS, isBotSlug } from '@/lib/bots';
import type { AlpacaAccount, AlpacaPosition, BenchmarkRow, TradeRow } from '@/lib/types';
import { authFetch } from '@/lib/auth-fetch';
import { EquityCurve } from '@/components/EquityCurve';
import { PositionsTable } from '@/components/PositionsTable';
import { TradesTable } from '@/components/TradesTable';

type Tab = 'overview' | 'positions' | 'trades';

export default function BotDetail({ params }: { params: Promise<{ bot: string }> }) {
  const { bot: slug } = use(params);
  if (!isBotSlug(slug)) notFound();
  const bot = BOTS[slug];

  const [tab, setTab] = useState<Tab>('overview');
  const [account, setAccount] = useState<AlpacaAccount | null>(null);
  const [history, setHistory] = useState<BenchmarkRow[]>([]);
  const [positions, setPositions] = useState<AlpacaPosition[]>([]);
  const [trades, setTrades] = useState<TradeRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [a, h, p, t] = await Promise.all([
        authFetch(`/api/alpaca/${slug}/account`).then((r) => (r.ok ? r.json() : null)),
        authFetch(`/api/memory/${slug}/benchmark.md`).then((r) => (r.ok ? r.json() : [])),
        authFetch(`/api/alpaca/${slug}/positions`).then((r) => (r.ok ? r.json() : [])),
        authFetch(`/api/memory/${slug}/trade-log.md`).then((r) => (r.ok ? r.json() : [])),
      ]);
      if (cancelled) return;
      setAccount(a);
      setHistory(h);
      setPositions(p);
      setTrades(t);
    }
    load();
    const id = setInterval(load, 60_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [slug]);

  const eq = account?.equity ?? 0;
  const lastEq = account?.last_equity ?? 0;
  const todayPct = lastEq > 0 ? ((eq - lastEq) / lastEq) * 100 : 0;

  return (
    <main className="max-w-3xl mx-auto p-4 space-y-4">
      <div>
        <Link href="/" className="text-xs text-muted hover:text-white">
          ← dashboard
        </Link>
      </div>
      <header className="pb-3 border-b border-border">
        <h1 className="text-xl font-semibold">{bot.label}</h1>
        <div className="flex items-baseline gap-4 mt-1">
          <span className="num text-lg">
            ${eq.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </span>
          <span className={`num text-sm ${todayPct >= 0 ? 'text-up' : 'text-down'}`}>
            {todayPct >= 0 ? '+' : ''}
            {todayPct.toFixed(2)}%
          </span>
          <span className="text-xs text-muted">vs {bot.benchmarkLabel}</span>
        </div>
      </header>

      <nav className="flex gap-1 text-sm">
        {(['overview', 'positions', 'trades'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded border ${
              tab === t
                ? 'bg-panelAlt border-border text-white'
                : 'border-transparent text-muted hover:text-white'
            }`}
          >
            {t}
          </button>
        ))}
      </nav>

      {tab === 'overview' && (
        <section className="panel p-3">
          <div className="stat-label mb-2">Equity vs {bot.benchmarkLabel} — last {history.length} days</div>
          <EquityCurve rows={history} height={280} />
        </section>
      )}

      {tab === 'positions' && <PositionsTable rows={positions} />}

      {tab === 'trades' && <TradesTable rows={trades} />}
    </main>
  );
}
