'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BOTS, BOT_SLUGS } from '@/lib/bots';
import { MarketHoursPill } from './MarketHoursPill';

interface Item {
  href: string;
  label: string;
  match: (path: string) => boolean;
}

const ITEMS: Item[] = [
  { href: '/', label: 'Dashboard', match: (p) => p === '/' },
  { href: '/compare', label: 'Compare', match: (p) => p.startsWith('/compare') },
  ...BOT_SLUGS.map((slug) => ({
    href: `/${slug}`,
    label: BOTS[slug].label,
    match: (p: string) => p === `/${slug}`,
  })),
];

export function NavHeader() {
  const pathname = usePathname() ?? '/';
  return (
    <header className="flex items-center gap-3 flex-wrap pb-3 border-b border-border">
      <Link href="/" className="font-semibold text-sm tracking-tight">
        Trader
      </Link>
      <nav className="flex gap-1 text-xs flex-wrap">
        {ITEMS.map((item) => {
          const active = item.match(pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`px-2 py-1 rounded border transition-colors ${
                active
                  ? 'bg-panelAlt border-border text-white'
                  : 'border-transparent text-muted hover:text-white hover:bg-panelAlt/50'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="ml-auto">
        <MarketHoursPill />
      </div>
    </header>
  );
}
