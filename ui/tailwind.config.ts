import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        panel: '#0f1418',
        panelAlt: '#141a20',
        hero: '#131a22',
        border: '#1f2a33',
        borderStrong: '#2a3742',
        accent: '#3b82f6',
        up: '#16a34a',
        down: '#dc2626',
        muted: '#94a3b8',
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.02)',
        cardHover: '0 4px 14px rgba(0,0,0,0.45), 0 0 0 1px rgba(59,130,246,0.25)',
      },
    },
  },
  plugins: [],
};

export default config;
