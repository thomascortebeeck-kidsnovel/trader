'use client';

import { useEffect, useState, use } from 'react';
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
import { formatPct, formatSignedUSD, formatUSD } from '@/lib/format';
import { EquityCurve } from '@/components/EquityCurve';
import { NavHeader } from '@/components/NavHeader';
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
  const todayDollar = eq - lastEq;
  const todayPct = lastEq > 0 ? (todayDollar / lastEq) * 100 : 0;
  const openPL = positions.reduce((s, p) => s + (p.unrealized_pl ?? 0), 0);

  return (
    <main className="max-w-5xl mx-auto p-4 space-y-4">
      <NavHeader />

      <header className="panel p-4">
        <div className="flex items-baseline justify-between flex-wrap gap-3">
          <div>
            <div className="stat-label">{bot.benchmarkLabel} benchmark</div>
            <h1 className="text-xl font-semibold mt-0.5">{bot.label}</h1>
          </div>
          <div className="text-right">
            <div className="num text-2xl">{loaded ? formatUSD(eq) : '—'}</div>
            {loaded && (
              <div className={`num text-xs ${todayPct >= 0 ? 'text-up' : 'text-down'}`}>
                {formatPct(todayPct)} · {formatSignedUSD(todayDollar)} today
              </div>
            )}
          </div>
        </div>
        {loaded && (
          <div className="grid grid-cols-3 gap-3 mt-4 pt-3 border-t border-border text-xs">
            <div>
              <div className="stat-label">Cash</div>
              <div className="num mt-0.5">{formatUSD(account?.cash ?? 0)}</div>
            </div>
            <div>
              <div className="stat-label">Positions · Open P/L</div>
              <div
                className={`num mt-0.5 ${
                  positions.length === 0 ? 'text-muted' : openPL >= 0 ? 'text-up' : 'text-down'
                }`}
              >
                {positions.length} · {positions.length === 0 ? '—' : formatSignedUSD(openPL, 2)}
              </div>
            </div>
            <div>
              <div className="stat-label">Day-trade count</div>
              <div className="num mt-0.5">{account?.daytrade_count ?? 0}</div>
            </div>
          </div>
        )}
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
