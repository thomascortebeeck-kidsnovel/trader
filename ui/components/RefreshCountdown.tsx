'use client';

import { useEffect, useState } from 'react';

interface Props {
  lastRefresh: Date;
  intervalMs: number;
}

export function RefreshCountdown({ lastRefresh, intervalMs }: Props) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const remainingMs = Math.max(0, lastRefresh.getTime() + intervalMs - now);
  const seconds = Math.ceil(remainingMs / 1000);

  return (
    <span className="text-[10px] text-muted font-mono tabular-nums" title="Next poll">
      next in {seconds}s
    </span>
  );
}
