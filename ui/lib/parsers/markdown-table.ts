// Shared markdown-table parser. Builds a column-name → index map from the
// header row so downstream callers can look up cells by name instead of
// positional index. If columns are reordered or new ones added to the
// bots' memory files, this won't silently drop rows.

export interface MarkdownTable {
  columns: string[];
  rows: string[][];
  errors: ParseError[];
}

export interface ParseError {
  line: number;
  reason: string;
}

export function parseMarkdownTable(md: string): MarkdownTable {
  const lines = md.split('\n');
  const errors: ParseError[] = [];
  let columns: string[] | null = null;
  const rows: string[][] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line.startsWith('|') || !line.endsWith('|')) continue;
    const cells = line
      .slice(1, -1)
      .split('|')
      .map((c) => c.trim());

    // Separator row: all cells are dashes / colons. Skip silently.
    if (cells.every((c) => c.replaceAll('-', '').replaceAll(':', '') === '')) continue;

    if (columns === null) {
      columns = cells.map((c) => c.toLowerCase());
      continue;
    }

    if (cells.length !== columns.length) {
      errors.push({
        line: i + 1,
        reason: `expected ${columns.length} columns, got ${cells.length}`,
      });
      continue;
    }
    rows.push(cells);
  }

  return { columns: columns ?? [], rows, errors };
}

/** Returns a getter that fetches a cell by column name. Throws if the
 * column doesn't exist — call hasColumn() first or use getOptional. */
export function columnGetter(table: MarkdownTable) {
  const index: Record<string, number> = {};
  for (let i = 0; i < table.columns.length; i++) index[table.columns[i]] = i;

  return {
    has: (col: string) => col in index,
    get: (row: string[], col: string): string => {
      const idx = index[col];
      if (idx === undefined) throw new Error(`column '${col}' not found in table`);
      return row[idx];
    },
    getOptional: (row: string[], col: string): string | undefined => {
      const idx = index[col];
      return idx === undefined ? undefined : row[idx];
    },
  };
}

export function parseNumberCell(s: string | undefined): number {
  if (s === undefined) return NaN;
  return Number(s.replace(/[$%,\s]/g, ''));
}
