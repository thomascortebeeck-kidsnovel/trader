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
import type { BenchmarkRow } from '@/lib/types';

interface Props {
  rows: BenchmarkRow[];
  benchmarkLabel: string;
  spyRows?: BenchmarkRow[] | null;
  height?: number;
}

export function EquityCurve({ rows, benchmarkLabel, spyRows, height = 260 }: Props) {
  if (!rows.length) {
    return <div className="text-muted text-sm p-4">no history yet</div>;
  }

  const startEq = rows[0].equity;
  const startBench = rows[0].benchClose;
  const showSpyOverlay = benchmarkLabel !== 'SPY' && spyRows && spyRows.length > 0;
  const dateToSpy = new Map(spyRows?.map((r) => [r.date, r.benchClose]) ?? []);
  const spyStart =
    showSpyOverlay && spyRows
      ? (dateToSpy.get(rows[0].date) ?? spyRows[0].benchClose)
      : null;

  const data = rows.map((r) => {
    const spyClose = dateToSpy.get(r.date);
    return {
      date: r.date,
      bot: (r.equity / startEq) * 100,
      [benchmarkLabel]: (r.benchClose / startBench) * 100,
      ...(showSpyOverlay && spyStart && spyClose != null
        ? { SPY: (spyClose / spyStart) * 100 }
        : {}),
    };
  });

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
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
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Line
          type="monotone"
          dataKey="bot"
          stroke="#3b82f6"
          dot={false}
          strokeWidth={2}
          isAnimationActive={false}
        />
        <Line
          type="monotone"
          dataKey={benchmarkLabel}
          stroke="#94a3b8"
          dot={false}
          strokeDasharray="3 3"
          strokeWidth={1.3}
          isAnimationActive={false}
        />
        {showSpyOverlay && (
          <Line
            type="monotone"
            dataKey="SPY"
            stroke="#f59e0b"
            dot={false}
            strokeDasharray="4 2"
            strokeWidth={1.3}
            isAnimationActive={false}
            connectNulls
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}
