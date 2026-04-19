import type { BenchmarkRow } from '../types';

// Parses a GitHub-flavored markdown table with columns:
// | date | equity | day_pl | benchmark | bench_close | bot_vs_bench |
export function parseBenchmark(md: string): BenchmarkRow[] {
  const rows: BenchmarkRow[] = [];
  const lines = md.split('\n');
  for (const raw of lines) {
    const line = raw.trim();
    if (!line.startsWith('|') || !line.endsWith('|')) continue;
    const cells = line
      .slice(1, -1)
      .split('|')
      .map((c) => c.trim());
    if (cells.length < 6) continue;
    if (cells[0] === 'date') continue;
    if (cells[0].replaceAll('-', '') === '') continue;
    const [date, equity, dayPl, benchmark, benchClose, botVsBench] = cells;
    const equityN = Number(equity.replace(/[$,]/g, ''));
    const closeN = Number(benchClose.replace(/[$,]/g, ''));
    if (!isFinite(equityN) || !isFinite(closeN)) continue;
    rows.push({
      date,
      equity: equityN,
      dayPl: Number(dayPl.replace(/[%$,]/g, '')),
      benchmark,
      benchClose: closeN,
      botVsBench: Number(botVsBench.replace(/[%$,]/g, '')),
    });
  }
  return rows;
}
