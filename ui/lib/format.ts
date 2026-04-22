const USD_0 = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const USD_2 = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
});

export function formatUSD(n: number, decimals: 0 | 2 = 0): string {
  if (!isFinite(n)) return '—';
  return decimals === 0 ? USD_0.format(n) : USD_2.format(n);
}

export function formatPct(n: number, decimals = 2): string {
  if (!isFinite(n)) return '—';
  const sign = n > 0 ? '+' : '';
  return `${sign}${n.toFixed(decimals)}%`;
}

export function formatSignedUSD(n: number, decimals: 0 | 2 = 0): string {
  if (!isFinite(n)) return '—';
  const abs = decimals === 0 ? USD_0.format(Math.abs(n)) : USD_2.format(Math.abs(n));
  if (n > 0) return `+${abs}`;
  if (n < 0) return `−${abs}`;
  return abs;
}

// Normalize an equity series so the first value is 100.
// Returns null if the series has fewer than 2 points or starts at 0.
export function normalizeTo100(series: number[]): number[] | null {
  if (series.length < 2) return null;
  const start = series[0];
  if (!(start > 0)) return null;
  return series.map((v) => (v / start) * 100);
}

// yyyy-mm-dd in America/New_York. Used to filter trade-log rows by trading day.
export function isoTodayET(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const y = parts.find((p) => p.type === 'year')?.value ?? '';
  const m = parts.find((p) => p.type === 'month')?.value ?? '';
  const d = parts.find((p) => p.type === 'day')?.value ?? '';
  return `${y}-${m}-${d}`;
}

// Window sizes used by the compare page.
export type CompareWindow = '7d' | '30d' | '90d' | 'YTD' | 'All';

export function sliceByWindow<T extends { date: string }>(
  rows: T[],
  window: CompareWindow,
  now: Date = new Date(),
): T[] {
  if (window === 'All') return rows;
  if (window === 'YTD') {
    const year = now.getFullYear().toString();
    return rows.filter((r) => r.date >= `${year}-01-01`);
  }
  const days = window === '7d' ? 7 : window === '30d' ? 30 : 90;
  const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const cutoffISO = cutoff.toISOString().slice(0, 10);
  return rows.filter((r) => r.date >= cutoffISO);
}
