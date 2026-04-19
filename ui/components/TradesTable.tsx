'use client';

import { useMemo, useState } from 'react';
import type { TradeRow } from '@/lib/types';

type SortKey = 'timestamp' | 'symbol' | 'side' | 'qty' | 'price';

export function TradesTable({ rows }: { rows: TradeRow[] }) {
  const [sortKey, setSortKey] = useState<SortKey>('timestamp');
  const [asc, setAsc] = useState(false);

  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (av === bv) return 0;
      const cmp = av < bv ? -1 : 1;
      return asc ? cmp : -cmp;
    });
    return copy;
  }, [rows, sortKey, asc]);

  function toggle(k: SortKey) {
    if (sortKey === k) setAsc((v) => !v);
    else {
      setSortKey(k);
      setAsc(false);
    }
  }

  if (!rows.length) {
    return <div className="panel p-4 text-sm text-muted">no trades yet</div>;
  }

  const head = (label: string, key: SortKey, align: 'left' | 'right' = 'left') => (
    <th
      onClick={() => toggle(key)}
      className={`cursor-pointer px-3 py-2 text-${align} text-xs uppercase tracking-wider text-muted hover:text-white`}
    >
      {label}
      {sortKey === key && <span className="ml-1">{asc ? '↑' : '↓'}</span>}
    </th>
  );

  return (
    <div className="panel overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr>
            {head('When', 'timestamp')}
            {head('Sym', 'symbol')}
            {head('Side', 'side')}
            {head('Qty', 'qty', 'right')}
            {head('Price', 'price', 'right')}
            <th className="text-left px-3 py-2 text-xs uppercase tracking-wider text-muted">
              Thesis
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((r) => (
            <tr key={`${r.orderId}-${r.timestamp}`} className="border-t border-border">
              <td className="px-3 py-2 text-xs text-muted">{r.timestamp.slice(0, 16).replace('T', ' ')}</td>
              <td className="px-3 py-2 font-semibold">{r.symbol}</td>
              <td className={`px-3 py-2 ${r.side === 'buy' ? 'text-up' : 'text-down'}`}>
                {r.side}
              </td>
              <td className="px-3 py-2 text-right num">{r.qty}</td>
              <td className="px-3 py-2 text-right num">${r.price.toFixed(2)}</td>
              <td className="px-3 py-2 text-xs text-muted truncate max-w-[16rem]">{r.thesis}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
