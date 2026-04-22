import type { BenchmarkRow } from '../types';
import {
  columnGetter,
  parseMarkdownTable,
  parseNumberCell,
  type ParseError,
} from './markdown-table';

// Parses a GitHub-flavored markdown table with expected columns:
//   date, equity, day_pl, benchmark, bench_close, bot_vs_bench
//
// Uses a column-name → index map so extra columns or reordering don't
// silently drop rows. Returns parse errors alongside the data so the
// UI can surface "N rows couldn't be parsed" when something drifts.
export interface BenchmarkParseResult {
  rows: BenchmarkRow[];
  errors: ParseError[];
}

const REQUIRED = ['date', 'equity', 'benchmark', 'bench_close'] as const;

export function parseBenchmark(md: string): BenchmarkRow[] {
  return parseBenchmarkDetailed(md).rows;
}

export function parseBenchmarkDetailed(md: string): BenchmarkParseResult {
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
          reason: `benchmark.md is missing required columns: ${missing.join(', ')}`,
        },
      ],
    };
  }

  const col = columnGetter(table);
  const rows: BenchmarkRow[] = [];
  for (let i = 0; i < table.rows.length; i++) {
    const cells = table.rows[i];
    const date = col.get(cells, 'date');
    const equity = parseNumberCell(col.get(cells, 'equity'));
    const benchmark = col.get(cells, 'benchmark');
    const benchClose = parseNumberCell(col.get(cells, 'bench_close'));
    if (!isFinite(equity) || !isFinite(benchClose)) {
      errors.push({ line: i + 1, reason: 'equity or bench_close is not a number' });
      continue;
    }
    rows.push({
      date,
      equity,
      dayPl: parseNumberCell(col.getOptional(cells, 'day_pl') ?? '0'),
      benchmark,
      benchClose,
      botVsBench: parseNumberCell(col.getOptional(cells, 'bot_vs_bench') ?? '0'),
    });
  }

  // Ensure rows are chronological regardless of source order.
  rows.sort((a, b) => a.date.localeCompare(b.date));
  return { rows, errors };
}
