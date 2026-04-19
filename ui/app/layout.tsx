import type { Metadata } from 'next';
import './globals.css';
import { AuthGate } from '@/components/AuthGate';

export const metadata: Metadata = {
  title: 'Trader Dashboard',
  description: 'Read-only view of the three trading bots',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <AuthGate>{children}</AuthGate>
      </body>
    </html>
  );
}
