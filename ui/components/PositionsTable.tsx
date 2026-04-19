'use client';

import type { AlpacaPosition } from '@/lib/types';

export function PositionsTable({ rows }: { rows: AlpacaPosition[] }) {
  if (!rows.length) {
    return <div className="panel p-4 text-sm text-muted">no open positions</div>;
  }
  return (
    <div className="panel overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-muted text-xs uppercase tracking-wider">
            <th className="text-left px-3 py-2">Symbol</th>
            <th className="text-right px-3 py-2">Qty</th>
            <th className="text-right px-3 py-2">Avg</th>
            <th className="text-right px-3 py-2">Last</th>
            <th className="text-right px-3 py-2">Mkt val</th>
            <th className="text-right px-3 py-2">P/L %</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.symbol} className="border-t border-border">
              <td className="px-3 py-2 font-semibold">{r.symbol}</td>
              <td className="px-3 py-2 text-right num">{r.qty}</td>
              <td className="px-3 py-2 text-right num">${r.avg_entry_price.toFixed(2)}</td>
              <td className="px-3 py-2 text-right num">${r.current_price.toFixed(2)}</td>
              <td className="px-3 py-2 text-right num">
                ${r.market_value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </td>
              <td
                className={`px-3 py-2 text-right num ${
                  r.unrealized_plpc >= 0 ? 'text-up' : 'text-down'
                }`}
              >
                {r.unrealized_plpc >= 0 ? '+' : ''}
                {(r.unrealized_plpc * 100).toFixed(2)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
