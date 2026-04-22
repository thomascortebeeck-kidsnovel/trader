import type { TradeRow } from '../types';
import {
  columnGetter,
  parseMarkdownTable,
  parseNumberCell,
  type ParseError,
} from './markdown-table';

// Parses a GitHub-flavored markdown table with expected columns:
//   timestamp, symbol, side, qty, price, order_id, thesis
//
// Uses a column-name → index map so column additions/reorderings don't
// silently drop rows. Returns parse errors so the UI can surface them.
export interface TradeLogParseResult {
  rows: TradeRow[];
  errors: ParseError[];
}

const REQUIRED = ['timestamp', 'symbol', 'side', 'qty', 'price'] as const;

export function parseTradeLog(md: string): TradeRow[] {
  return parseTradeLogDetailed(md).rows;
}

export function parseTradeLogDetailed(md: string): TradeLogParseResult {
  const table = parseMarkdownTable(md);
  const errors = [...table.errors];
  if (table.columns.length === 0) return { rows: [], errors };

  const missing = REQUIRED.filter((c) => !table.columns.includes(c));
  if (missing.length > 0) {
    return {
      rows: [],
      errors: [
        {
          line: 0,
          reason: `trade-log.md is missing required columns: ${missing.join(', ')}`,
        },
      ],
    };
  }

  const col = columnGetter(table);
  const rows: TradeRow[] = [];
  for (let i = 0; i < table.rows.length; i++) {
    const cells = table.rows[i];
    const qty = parseNumberCell(col.get(cells, 'qty'));
    const price = parseNumberCell(col.get(cells, 'price'));
    if (!isFinite(qty) || !isFinite(price)) {
      errors.push({ line: i + 1, reason: 'qty or price is not a number' });
      continue;
    }
    const side = col.get(cells, 'side').toLowerCase();
    rows.push({
      timestamp: col.get(cells, 'timestamp'),
      symbol: col.get(cells, 'symbol'),
      side: side === 'sell' ? 'sell' : 'buy',
      qty,
      price,
      orderId: col.getOptional(cells, 'order_id') ?? '',
      thesis: col.getOptional(cells, 'thesis') ?? '',
    });
  }
  return { rows, errors };
}
