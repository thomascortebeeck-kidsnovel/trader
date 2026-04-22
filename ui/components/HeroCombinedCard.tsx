'use client';

import { Area, AreaChart, Line, ResponsiveContainer, Tooltip, YAxis } from 'recharts';
import type { AlpacaAccount, BenchmarkRow, BotSlug } from '@/lib/types';
import { BOT_SLUGS } from '@/lib/bots';
import { formatPct, formatSignedUSD, formatUSD } from '@/lib/format';
import { RefreshCountdown } from './RefreshCountdown';

interface BotLike {
  account: AlpacaAccount | null;
  history: BenchmarkRow[];
}

interface Props {
  state: Record<BotSlug, BotLike | undefined>;
  lastRefresh: Date;
  refreshIntervalMs: number;
  isLoading: boolean;
}

// Build a combined equity series using only dates where every bot with
// non-empty history has a row. Also returns SPY (general's benchClose) on
// those same dates.
function buildCombinedSeries(state: Record<BotSlug, BotLike | undefined>): {
  points: { date: string; combined: number; spy: number | null }[];
} {
  const perBot: Record<string, Map<string, BenchmarkRow>> = {};
  for (const slug of BOT_SLUGS) {
    const rows = state[slug]?.history ?? [];
    if (!rows.length) continue;
    perBot[slug] = new Map(rows.map((r) => [r.date, r]));
  }
  const slugs = Object.keys(perBot) as BotSlug[];
  if (slugs.length === 0) return { points: [] };

  let commonDates = Array.from(perBot[slugs[0]].keys());
  for (let i = 1; i < slugs.length; i++) {
    const next = perBot[slugs[i]];
    commonDates = commonDates.filter((d) => next.has(d));
  }
  commonDates.sort();

  const spyMap =
    state['general']?.history && state['general'].history.length > 0
      ? new Map(state['general'].history.map((r) => [r.date, r.benchClose]))
      : null;

  const points = commonDates.map((date) => {
    let combined = 0;
    for (const slug of slugs) combined += perBot[slug].get(date)!.equity;
    return { date, combined, spy: spyMap?.get(date) ?? null };
  });
  return { points };
}

export function HeroCombinedCard({ state, lastRefresh, refreshIntervalMs, isLoading }: Props) {
  const combinedEquity = BOT_SLUGS.reduce(
    (sum, s) => sum + (state[s]?.account?.equity ?? 0),
    0,
  );
  const combinedLast = BOT_SLUGS.reduce(
    (sum, s) => sum + (state[s]?.account?.last_equity ?? 0),
    0,
  );
  const todayDollar = combinedEquity - combinedLast;
  const todayPct = combinedLast > 0 ? (todayDollar / combinedLast) * 100 : 0;

  const { points } = buildCombinedSeries(state);
  const hasHistory = points.length >= 2;

  const firstCombined = hasHistory ? points[0].combined : combinedEquity;
  const firstSpy = hasHistory ? points[0].spy : null;
  const lastPoint = hasHistory ? points[points.length - 1] : null;

  // Normalized to 100 so combined equity + SPY share a y-axis scale.
  const chartData = points.map((p) => ({
    date: p.date,
    combined: firstCombined > 0 ? (p.combined / firstCombined) * 100 : null,
    spy:
      firstSpy !== null && firstSpy > 0 && p.spy !== null
        ? (p.spy / firstSpy) * 100
        : null,
  }));

  const combinedCumPct =
    hasHistory && firstCombined > 0
      ? ((combinedEquity - firstCombined) / firstCombined) * 100
      : null;
  const spyCumPct =
    hasHistory && firstSpy !== null && firstSpy > 0 && lastPoint?.spy !== null
      ? ((lastPoint!.spy! - firstSpy) / firstSpy) * 100
      : null;
  const alpha =
    combinedCumPct !== null && spyCumPct !== null ? combinedCumPct - spyCumPct : null;

  const periodPct = (cutoffDaysAgo: number): number | null => {
    if (!hasHistory) return null;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - cutoffDaysAgo);
    const cutoffISO = cutoff.toISOString().slice(0, 10);
    const inWindow = points.find((p) => p.date >= cutoffISO);
    if (!inWindow || inWindow.combined <= 0) return null;
    return ((combinedEquity - inWindow.combined) / inWindow.combined) * 100;
  };
  const ytdPct = (() => {
    if (!hasHistory) return null;
    const year = new Date().getFullYear();
    const firstOfYear = points.find((p) => p.date >= `${year}-01-01`);
    if (!firstOfYear || firstOfYear.combined <= 0) return null;
    return ((combinedEquity - firstOfYear.combined) / firstOfYear.combined) * 100;
  })();

  const weekPct = periodPct(7);
  const monthPct = periodPct(30);

  return (
    <section className="hero-card p-4 md:p-5">
      <div className="flex items-baseline justify-between flex-wrap gap-2">
        <div>
          <div className="stat-label">Combined · All bots</div>
          <div className="num text-3xl md:text-4xl font-semibold mt-0.5">
            {isLoading ? '—' : formatUSD(combinedEquity)}
          </div>
          {!isLoading && (
            <div className="flex items-center gap-3 mt-1 text-sm flex-wrap">
              <span className={`num ${todayPct >= 0 ? 'text-up' : 'text-down'}`}>
                {formatPct(todayPct)} · {formatSignedUSD(todayDollar)} today
              </span>
              {alpha !== null && (
                <span className={`num text-xs ${alpha >= 0 ? 'text-up' : 'text-down'}`}>
                  {formatPct(alpha)} vs SPY
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col items-end text-right">
          <div className="text-[10px] text-muted">
            as of {lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
          <RefreshCountdown lastRefresh={lastRefresh} intervalMs={refreshIntervalMs} />
        </div>
      </div>

      {hasHistory ? (
        <div className="mt-4 h-24">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="heroCombinedFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <YAxis hide domain={['dataMin - 0.5', 'dataMax + 0.5']} />
              <Tooltip
                contentStyle={{
                  background: '#141a20',
                  border: '1px solid #1f2a33',
                  fontSize: 11,
                  padding: '4px 8px',
                }}
                formatter={(v: number, name: string) => [
                  v != null ? `${v.toFixed(2)}` : '—',
                  name === 'combined' ? 'Combined' : 'SPY',
                ]}
                labelFormatter={(l) => String(l)}
              />
              <Area
                type="monotone"
                dataKey="combined"
                stroke="#3b82f6"
                fill="url(#heroCombinedFill)"
                strokeWidth={2}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="spy"
                stroke="#94a3b8"
                strokeDasharray="3 3"
                dot={false}
                strokeWidth={1.3}
                isAnimationActive={false}
                connectNulls
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="mt-3 text-[11px] text-muted">
          {isLoading
            ? 'loading history…'
            : 'no multi-bot history yet — weekly-review populates the combined curve'}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4 pt-3 border-t border-border">
        <StatCell label="Today" pct={todayPct} always />
        <StatCell label="Week" pct={weekPct} />
        <StatCell label="Month" pct={monthPct} />
        <StatCell label="YTD" pct={ytdPct} />
      </div>
    </section>
  );
}

function StatCell({
  label,
  pct,
  always,
}: {
  label: string;
  pct: number | null;
  always?: boolean;
}) {
  const show = pct !== null || always;
  const color =
    pct === null ? 'text-muted' : pct >= 0 ? 'text-up' : 'text-down';
  return (
    <div>
      <div className="stat-label">{label}</div>
      <div className={`num text-sm mt-0.5 ${color}`}>
        {show && pct !== null ? formatPct(pct) : '—'}
      </div>
    </div>
  );
}
