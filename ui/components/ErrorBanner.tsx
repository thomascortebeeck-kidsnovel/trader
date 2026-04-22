'use client';

// Small banner for user-visible errors from API calls or parsers.
// Keeps dashboard rendering (don't replace the whole page), just
// tells the operator what went wrong.

export type BannerSeverity = 'error' | 'warn';

export interface BannerItem {
  severity: BannerSeverity;
  source: string; // e.g. "kraken / account", "news / trade-log.md"
  message: string;
}

interface Props {
  items: BannerItem[];
}

const COLORS: Record<BannerSeverity, string> = {
  error: 'border-red-700 bg-red-950/40 text-red-200',
  warn: 'border-yellow-700 bg-yellow-950/30 text-yellow-200',
};

export function ErrorBanner({ items }: Props) {
  if (items.length === 0) return null;
  return (
    <div className="space-y-1.5">
      {items.map((it, i) => (
        <div
          key={i}
          className={`border rounded px-3 py-1.5 text-xs ${COLORS[it.severity]}`}
        >
          <span className="font-mono opacity-70">{it.source}</span>
          <span className="mx-2 opacity-50">·</span>
          <span>{it.message}</span>
        </div>
      ))}
    </div>
  );
}
