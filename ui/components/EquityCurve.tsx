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
  height?: number;
}

export function EquityCurve({ rows, height = 260 }: Props) {
  if (!rows.length) {
    return <div className="text-muted text-sm p-4">no history yet</div>;
  }

  const startEq = rows[0].equity;
  const startBench = rows[0].benchClose;
  const data = rows.map((r) => ({
    date: r.date,
    bot: (r.equity / startEq) * 100,
    benchmark: (r.benchClose / startBench) * 100,
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
        <CartesianGrid stroke="#1f2a33" strokeDasharray="3 3" />
        <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 10 }} minTickGap={40} />
        <YAxis
          tick={{ fill: '#94a3b8', fontSize: 10 }}
          domain={['dataMin - 1', 'dataMax + 1']}
          tickFormatter={(v) => `${v.toFixed(0)}`}
        />
        <Tooltip
          contentStyle={{ background: '#141a20', border: '1px solid #1f2a33', fontSize: 12 }}
          formatter={(v: number) => v.toFixed(2)}
        />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Line type="monotone" dataKey="bot" stroke="#3b82f6" dot={false} strokeWidth={1.7} isAnimationActive={false} />
        <Line
          type="monotone"
          dataKey="benchmark"
          stroke="#94a3b8"
          dot={false}
          strokeDasharray="3 3"
          strokeWidth={1.3}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
