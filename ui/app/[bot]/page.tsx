'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BOTS, isBotSlug } from '@/lib/bots';
import type {
  AlpacaAccount,
  AlpacaPosition,
  BenchmarkRow,
  MemoryParseResponse,
  TradeRow,
} from '@/lib/types';
import { authFetchJSON } from '@/lib/auth-fetch';
import { EquityCurve } from '@/components/EquityCurve';
import { PositionsTable } from '@/components/PositionsTable';
import { TradesTable } from '@/components/TradesTable';
import { ErrorBanner, type BannerItem } from '@/components/ErrorBanner';

type Tab = 'overview' | 'positions' | 'trades';

export default function BotDetail({ params }: { params: Promise<{ bot: string }> }) {
  const { bot: slug } = use(params);
  if (!isBotSlug(slug)) notFound();
  const bot = BOTS[slug];

  const [tab, setTab] = useState<Tab>('overview');
  const [account, setAccount] = useState<AlpacaAccount | null>(null);
  const [history, setHistory] = useState<BenchmarkRow[]>([]);
  const [spyHistory, setSpyHistory] = useState<BenchmarkRow[]>([]);
  const [positions, setPositions] = useState<AlpacaPosition[]>([]);
  const [trades, setTrades] = useState<TradeRow[]>([]);
  const [errors, setErrors] = useState<BannerItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  const needsSpyOverlay = bot.benchmark !== 'SPY';

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const banners: BannerItem[] = [];
      const [a, h, p, t, spy] = await Promise.all([
        authFetchJSON<AlpacaAccount>(`/api/alpaca/${slug}/account`),
        authFetchJSON<MemoryParseResponse<BenchmarkRow>>(`/api/memory/${slug}/benchmark.md`),
        authFetchJSON<AlpacaPosition[]>(`/api/alpaca/${slug}/positions`),
        authFetchJSON<MemoryParseResponse<TradeRow>>(`/api/memory/${slug}/trade-log.md`),
        needsSpyOverlay
          ? authFetchJSON<MemoryParseResponse<BenchmarkRow>>(`/api/memory/general/benchmark.md`)
          : Promise.resolve({ ok: true, status: 200, data: { rows: [], errors: [] }, error: null }),
      ]);
      if (cancelled) return;

      for (const [res, source] of [
        [a, `${slug} · account`],
        [h, `${slug} · benchmark.md`],
        [p, `${slug} · positions`],
        [t, `${slug} · trade-log.md`],
        [spy, `general · benchmark.md`],
      ] as const) {
        if (!res.ok && res.error) {
          banners.push({
            severity: res.error.code === 'credentials_missing' ? 'warn' : 'error',
            source,
            message: `${res.error.code}: ${res.error.message}`,
          });
        }
      }
      if (h.ok && h.data?.errors?.length) {
        for (const e of h.data.errors) {
          banners.push({ severity: 'warn', source: `${slug} · benchmark.md line ${e.line}`, message: e.reason });
        }
      }
      if (t.ok && t.data?.errors?.length) {
        for (const e of t.data.errors) {
          banners.push({ severity: 'warn', source: `${slug} · trade-log.md line ${e.line}`, message: e.reason });
        }
      }

      setAccount(a.data);
      setHistory(h.data?.rows ?? []);
      setPositions(p.data ?? []);
      setTrades(t.data?.rows ?? []);
      setSpyHistory(spy.data?.rows ?? []);
      setErrors(banners);
      setLoaded(true);
    }
    load();
    const id = setInterval(load, 60_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [slug, needsSpyOverlay]);

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
            {loaded ? `$${eq.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '—'}
          </span>
          {loaded && (
            <span className={`num text-sm ${todayPct >= 0 ? 'text-up' : 'text-down'}`}>
              {todayPct >= 0 ? '+' : ''}
              {todayPct.toFixed(2)}%
            </span>
          )}
          <span className="text-xs text-muted">vs {bot.benchmarkLabel}</span>
        </div>
      </header>

      {errors.length > 0 && <ErrorBanner items={errors} />}

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
          <div className="stat-label mb-2">
            Equity vs {bot.benchmarkLabel}
            {needsSpyOverlay ? ' & SPY' : ''} — last {history.length} days
          </div>
          {history.length > 0 ? (
            <EquityCurve
              rows={history}
              benchmarkLabel={bot.benchmarkLabel}
              spyRows={needsSpyOverlay ? spyHistory : null}
              height={280}
            />
          ) : (
            <div className="text-xs text-muted py-8 text-center">
              {loaded ? 'no history yet — bot has not logged a benchmark row' : 'loading…'}
            </div>
          )}
        </section>
      )}

      {tab === 'positions' && <PositionsTable rows={positions} />}

      {tab === 'trades' && <TradesTable rows={trades} />}
    </main>
  );
}
