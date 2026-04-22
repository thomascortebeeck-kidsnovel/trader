'use client';

import { useEffect, useState } from 'react';
import { BOT_SLUGS, BOTS } from '@/lib/bots';
import type { BenchmarkRow, BotSlug, MemoryParseResponse } from '@/lib/types';
import { authFetchJSON } from '@/lib/auth-fetch';
import { NavHeader } from '@/components/NavHeader';
import { CompareChart } from '@/components/CompareChart';
import { ErrorBanner, type BannerItem } from '@/components/ErrorBanner';
import type { CompareWindow } from '@/lib/format';

const WINDOWS: CompareWindow[] = ['7d', '30d', '90d', 'YTD', 'All'];

const SERIES_COLOR: Record<string, string> = {
  general: '#3b82f6',
  'day-trader-kraken': '#f59e0b',
  'news-based': '#a855f7',
  SPY: '#94a3b8',
};

export default function ComparePage() {
  const [histories, setHistories] = useState<Record<BotSlug, BenchmarkRow[]>>({
    general: [],
    'day-trader-kraken': [],
    'news-based': [],
  });
  const [errors, setErrors] = useState<BannerItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [window, setWindow] = useState<CompareWindow>('30d');
  const [visible, setVisible] = useState<Record<string, boolean>>({
    general: true,
    'day-trader-kraken': true,
    'news-based': true,
    SPY: true,
  });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const banners: BannerItem[] = [];
      const results = await Promise.all(
        BOT_SLUGS.map((slug) =>
          authFetchJSON<MemoryParseResponse<BenchmarkRow>>(`/api/memory/${slug}/benchmark.md`),
        ),
      );
      if (cancelled) return;
      const next: Record<BotSlug, BenchmarkRow[]> = {
        general: [],
        'day-trader-kraken': [],
        'news-based': [],
      };
      BOT_SLUGS.forEach((slug, i) => {
        const res = results[i];
        if (!res.ok && res.error) {
          banners.push({
            severity: 'error',
            source: `${slug} · benchmark.md`,
            message: `${res.error.code}: ${res.error.message}`,
          });
        }
        next[slug] = res.data?.rows ?? [];
      });
      setHistories(next);
      setErrors(banners);
      setLoaded(true);
    }
    load();
    const id = setInterval(load, 60_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const hasAnyRow = BOT_SLUGS.some((s) => histories[s].length > 0);

  return (
    <main className="max-w-5xl mx-auto p-4 space-y-4">
      <NavHeader />

      {errors.length > 0 && <ErrorBanner items={errors} />}

      <section className="panel p-4 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <div className="stat-label">Compare · all bots vs SPY</div>
            <h2 className="text-lg font-semibold mt-0.5">Normalized equity (start = 100)</h2>
          </div>
          <div className="flex gap-1">
            {WINDOWS.map((w) => (
              <button
                key={w}
                onClick={() => setWindow(w)}
                className={`px-2 py-1 text-xs rounded border ${
                  window === w
                    ? 'bg-panelAlt border-accent/50 text-white'
                    : 'border-border text-muted hover:text-white'
                }`}
              >
                {w}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3 flex-wrap text-xs pt-1">
          {BOT_SLUGS.map((slug) => (
            <label key={slug} className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={visible[slug]}
                onChange={(e) => setVisible({ ...visible, [slug]: e.target.checked })}
                className="accent-accent"
              />
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: SERIES_COLOR[slug] }}
              />
              <span>{BOTS[slug].label}</span>
            </label>
          ))}
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={visible.SPY}
              onChange={(e) => setVisible({ ...visible, SPY: e.target.checked })}
              className="accent-accent"
            />
            <span className="h-2 w-2 rounded-full" style={{ background: SERIES_COLOR.SPY }} />
            <span>SPY</span>
          </label>
        </div>

        {loaded && !hasAnyRow ? (
          <div className="text-xs text-muted py-8 text-center">
            No bot has logged a benchmark row yet. End-of-day routines populate this once per trading day.
          </div>
        ) : (
          <CompareChart histories={histories} window={window} visible={visible} />
        )}
      </section>
    </main>
  );
}
