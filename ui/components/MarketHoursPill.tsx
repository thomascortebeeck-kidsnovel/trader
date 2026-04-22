'use client';

import { useEffect, useState } from 'react';

type Phase = 'closed' | 'pre' | 'open' | 'after';

interface Current {
  phase: Phase;
  etLabel: string;
}

function currentPhase(now: Date = new Date()): Current {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts = fmt.formatToParts(now);
  const weekday = parts.find((p) => p.type === 'weekday')?.value ?? '';
  const hour = parseInt(parts.find((p) => p.type === 'hour')?.value ?? '0', 10);
  const minute = parseInt(parts.find((p) => p.type === 'minute')?.value ?? '0', 10);
  const minutesET = hour * 60 + minute;
  const etLabel = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')} ET`;

  if (weekday === 'Sat' || weekday === 'Sun') {
    return { phase: 'closed', etLabel };
  }
  // Pre-market 04:00, Open 09:30, Close 16:00, After-hours to 20:00.
  if (minutesET >= 9 * 60 + 30 && minutesET < 16 * 60) return { phase: 'open', etLabel };
  if (minutesET >= 4 * 60 && minutesET < 9 * 60 + 30) return { phase: 'pre', etLabel };
  if (minutesET >= 16 * 60 && minutesET < 20 * 60) return { phase: 'after', etLabel };
  return { phase: 'closed', etLabel };
}

const STYLES: Record<Phase, { bg: string; dot: string; label: string }> = {
  open: { bg: 'bg-up/10 text-up border-up/30', dot: 'bg-up', label: 'MARKET OPEN' },
  pre: { bg: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30', dot: 'bg-yellow-500', label: 'PRE-MARKET' },
  after: { bg: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30', dot: 'bg-yellow-500', label: 'AFTER-HOURS' },
  closed: { bg: 'bg-panelAlt text-muted border-border', dot: 'bg-slate-500', label: 'CLOSED' },
};

export function MarketHoursPill() {
  const [cur, setCur] = useState<Current>(() => currentPhase());

  useEffect(() => {
    const tick = () => setCur(currentPhase());
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  const style = STYLES[cur.phase];
  return (
    <span
      className={`chip border ${style.bg}`}
      title={`US equities market — ${cur.etLabel}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {style.label}
    </span>
  );
}
