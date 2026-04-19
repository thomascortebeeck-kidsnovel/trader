import type { TradeRow } from '../types';

// Parses a GitHub-flavored markdown table with columns:
// | timestamp | symbol | side | qty | price | order_id | thesis |
export function parseTradeLog(md: string): TradeRow[] {
  const rows: TradeRow[] = [];
  const lines = md.split('\n');
  for (const raw of lines) {
    const line = raw.trim();
    if (!line.startsWith('|') || !line.endsWith('|')) continue;
    const cells = line
      .slice(1, -1)
      .split('|')
      .map((c) => c.trim());
    if (cells.length < 7) continue;
    if (cells[0] === 'timestamp') continue;              // header
    if (cells[0].replaceAll('-', '') === '') continue;   // separator row
    const [timestamp, symbol, side, qty, price, orderId, ...rest] = cells;
    const qtyN = Number(qty);
    const priceN = Number(price);
    if (!isFinite(qtyN) || !isFinite(priceN)) continue;
    rows.push({
      timestamp,
      symbol,
      side: side === 'sell' ? 'sell' : 'buy',
      qty: qtyN,
      price: priceN,
      orderId,
      thesis: rest.join(' | '),
    });
  }
  return rows;
}
