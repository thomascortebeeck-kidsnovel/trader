'use client';

import Link from 'next/link';
import type { BotMeta } from '@/lib/types';
import type { AlpacaAccount, BenchmarkRow, RoutineRun } from '@/lib/types';
import { Sparkline } from './Sparkline';

interface Props {
  bot: BotMeta;
  state:
    | {
        account: AlpacaAccount | null;
        history: BenchmarkRow[];
        routines: RoutineRun[];
      }
    | undefined;
  spyHistory?: BenchmarkRow[];
}

function formatRelative(iso: string | undefined): string {
  if (!iso) return '—';
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export function BotCard({ bot, state, spyHistory }: Props) {
  const eq = state?.account?.equity ?? 0;
  const last = state?.account?.last_equity ?? 0;
  const todayPct = last > 0 ? ((eq - last) / last) * 100 : 0;

  const hist = state?.history ?? [];
  const series = hist.map((r) => r.equity);
  const benchSeries = hist.map((r) => r.benchClose);

  const startEq = series[0] ?? eq;
  const startBench = benchSeries[0] ?? 1;
  const botCumPct = startEq > 0 ? ((eq - startEq) / startEq) * 100 : 0;
  const benchCumPct =
    startBench > 0 && benchSeries.length > 0
      ? ((benchSeries[benchSeries.length - 1] - startBench) / startBench) * 100
      : 0;
  const vsBench = botCumPct - benchCumPct;

  const spyRows = spyHistory ?? [];
  const showSpyStat = bot.benchmark !== 'SPY' && spyRows.length > 0;
  const spyStart = showSpyStat ? spyRows[0].benchClose : 0;
  const spyEnd = showSpyStat ? spyRows[spyRows.length - 1].benchClose : 0;
  const spyCumPct = spyStart > 0 ? ((spyEnd - spyStart) / spyStart) * 100 : 0;
  const vsSpy = botCumPct - spyCumPct;

  const latestRoutine = state?.routines?.[0];

  return (
    <Link href={`/${bot.slug}`} className="block panel p-4 hover:border-blue-500 transition-colors">
      <div className="flex items-baseline justify-between">
        <div className="font-semibold">{bot.label}</div>
        <div className="num text-right">
          ${eq.toLocaleString(undefined, { maximumFractionDigits: 0 })}
        </div>
      </div>
      <div className="flex gap-4 mt-1 text-xs flex-wrap">
        <span className={`num ${todayPct >= 0 ? 'text-up' : 'text-down'}`}>
          {todayPct >= 0 ? '+' : ''}
          {todayPct.toFixed(2)}% today
        </span>
        <span className={`num ${vsBench >= 0 ? 'text-up' : 'text-down'}`}>
          {vsBench >= 0 ? '+' : ''}
          {vsBench.toFixed(2)}% vs {bot.benchmarkLabel}
        </span>
        {showSpyStat && (
          <span className={`num ${vsSpy >= 0 ? 'text-up' : 'text-down'}`}>
            {vsSpy >= 0 ? '+' : ''}
            {vsSpy.toFixed(2)}% vs SPY
          </span>
        )}
      </div>
      <div className="mt-3">
        <Sparkline values={series} />
      </div>
      <div className="flex items-center justify-between mt-2 text-[11px] text-muted">
        <span>
          {latestRoutine
            ? `last: ${latestRoutine.routine} · ${formatRelative(latestRoutine.lastRunISO)}`
            : 'no routine commits yet'}
        </span>
        <span className="text-muted">→</span>
      </div>
    </Link>
  );
}
