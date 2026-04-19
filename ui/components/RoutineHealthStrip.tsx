'use client';

import type { AlpacaAccount, BenchmarkRow, RoutineRun } from '@/lib/types';
import { BOTS, BOT_SLUGS } from '@/lib/bots';

interface Props {
  state: Record<
    string,
    { account: AlpacaAccount | null; history: BenchmarkRow[]; routines: RoutineRun[] } | undefined
  >;
}

function staleness(iso: string | undefined): 'fresh' | 'warn' | 'stale' | 'none' {
  if (!iso) return 'none';
  const mins = (Date.now() - new Date(iso).getTime()) / 60_000;
  if (mins < 120) return 'fresh';
  if (mins < 480) return 'warn';
  return 'stale';
}

const DOT: Record<string, string> = {
  fresh: 'bg-up',
  warn: 'bg-yellow-500',
  stale: 'bg-down',
  none: 'bg-slate-600',
};

export function RoutineHealthStrip({ state }: Props) {
  return (
    <section className="panel p-3">
      <div className="stat-label mb-2">Routine health</div>
      <div className="space-y-1.5">
        {BOT_SLUGS.map((slug) => {
          const bot = BOTS[slug];
          const latest = state[slug]?.routines?.[0];
          const status = staleness(latest?.lastRunISO);
          return (
            <div key={slug} className="flex items-center text-xs gap-2">
              <span className={`h-2 w-2 rounded-full ${DOT[status]}`} />
              <span className="text-muted w-28 shrink-0 truncate">{bot.label}</span>
              <span className="font-mono truncate">
                {latest?.routine ?? '—'}
              </span>
              <span className="text-muted ml-auto shrink-0">
                {latest?.lastRunISO
                  ? new Date(latest.lastRunISO).toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'no commits'}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
