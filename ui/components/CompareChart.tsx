'use client';

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { BenchmarkRow, BotSlug } from '@/lib/types';
import { BOTS, BOT_SLUGS } from '@/lib/bots';
import { type CompareWindow, sliceByWindow } from '@/lib/format';

interface Props {
  histories: Record<BotSlug, BenchmarkRow[]>;
  window: CompareWindow;
  visible: Record<string, boolean>;
  height?: number;
}

const SERIES_COLOR: Record<string, string> = {
  general: '#3b82f6',
  'day-trader-kraken': '#f59e0b',
  'news-based': '#a855f7',
  SPY: '#94a3b8',
};

type ChartRow = {
  date: string;
  general?: number | null;
  'day-trader-kraken'?: number | null;
  'news-based'?: number | null;
  SPY?: number | null;
};

export function CompareChart({ histories, window, visible, height = 360 }: Props) {
  const sliced: Record<BotSlug, BenchmarkRow[]> = {
    general: sliceByWindow(histories.general ?? [], window),
    'day-trader-kraken': sliceByWindow(histories['day-trader-kraken'] ?? [], window),
    'news-based': sliceByWindow(histories['news-based'] ?? [], window),
  };

  const allDates = new Set<string>();
  for (const slug of BOT_SLUGS) {
    for (const r of sliced[slug]) allDates.add(r.date);
  }
  const sortedDates = Array.from(allDates).sort();

  const baseMap: Record<BotSlug, number | null> = {
    general: null,
    'day-trader-kraken': null,
    'news-based': null,
  };
  for (const slug of BOT_SLUGS) {
    const first = sliced[slug][0]?.equity;
    baseMap[slug] = first && first > 0 ? first : null;
  }
  const spyFirst = sliced['general'][0]?.benchClose;
  const spyBase = spyFirst && spyFirst > 0 ? spyFirst : null;

  const rowMaps: Record<BotSlug, Map<string, BenchmarkRow>> = {
    general: new Map(sliced.general.map((r) => [r.date, r])),
    'day-trader-kraken': new Map(sliced['day-trader-kraken'].map((r) => [r.date, r])),
    'news-based': new Map(sliced['news-based'].map((r) => [r.date, r])),
  };

  const data: ChartRow[] = sortedDates.map((date) => {
    const row: ChartRow = { date };
    for (const slug of BOT_SLUGS) {
      const r = rowMaps[slug].get(date);
      const base = baseMap[slug];
      row[slug] = r && base ? (r.equity / base) * 100 : null;
    }
    const spy = rowMaps['general'].get(date)?.benchClose;
    row.SPY = spy && spyBase ? (spy / spyBase) * 100 : null;
    return row;
  });

  const latestAbs = (key: keyof ChartRow): number | null => {
    for (let i = data.length - 1; i >= 0; i--) {
      const v = data[i][key];
      if (typeof v === 'number') return v - 100;
    }
    return null;
  };

  if (data.length < 2) {
    return (
      <div className="panel p-6 text-center text-xs text-muted">
        Not enough data in this window yet — try a wider range, or wait for end-of-day benchmark rows.
      </div>
    );
  }

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -8 }}>
          <CartesianGrid stroke="#1f2a33" strokeOpacity={0.5} strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 10 }} minTickGap={40} />
          <YAxis
            tick={{ fill: '#94a3b8', fontSize: 10 }}
            domain={['dataMin - 1', 'dataMax + 1']}
            tickFormatter={(v) => `${v.toFixed(0)}`}
            width={40}
          />
          <Tooltip
            contentStyle={{ background: '#141a20', border: '1px solid #1f2a33', fontSize: 12 }}
            formatter={(v: number) => v.toFixed(2)}
          />
          <Legend
            wrapperStyle={{ fontSize: 11 }}
            formatter={(val) => {
              const key = val as keyof ChartRow;
              const abs = latestAbs(key);
              const label =
                val === 'SPY'
                  ? 'SPY'
                  : BOTS[val as BotSlug]?.label ?? String(val);
              return `${label}${abs !== null ? ` · ${abs >= 0 ? '+' : ''}${abs.toFixed(2)}%` : ''}`;
            }}
          />
          {BOT_SLUGS.map((slug) =>
            visible[slug] ? (
              <Line
                key={slug}
                type="monotone"
                dataKey={slug}
                name={slug}
                stroke={SERIES_COLOR[slug]}
                dot={false}
                strokeWidth={2}
                isAnimationActive={false}
                connectNulls
              />
            ) : null,
          )}
          {visible.SPY && (
            <Line
              type="monotone"
              dataKey="SPY"
              stroke={SERIES_COLOR.SPY}
              dot={false}
              strokeDasharray="4 2"
              strokeWidth={1.5}
              isAnimationActive={false}
              connectNulls
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
