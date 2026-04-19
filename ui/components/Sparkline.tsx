'use client';

import { Line, LineChart, ResponsiveContainer, YAxis } from 'recharts';

interface Props {
  values: number[];
  color?: string;
  height?: number;
}

export function Sparkline({ values, color, height = 40 }: Props) {
  if (!values.length) {
    return <div style={{ height }} className="text-muted text-xs">no data</div>;
  }
  const first = values[0];
  const last = values[values.length - 1];
  const stroke = color ?? (last >= first ? '#16a34a' : '#dc2626');
  const data = values.map((v, i) => ({ i, v }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
        <YAxis hide domain={['dataMin', 'dataMax']} />
        <Line type="monotone" dataKey="v" stroke={stroke} dot={false} strokeWidth={1.5} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
