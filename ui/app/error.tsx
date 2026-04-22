'use client';

// Next.js renders this whenever a page throws during rendering or a
// server component errors. Without it, a single unhandled exception
// leaves the dashboard blank with no explanation.

import { useEffect } from 'react';

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[root error boundary]', error);
  }, [error]);

  return (
    <main className="max-w-3xl mx-auto p-6">
      <div className="border border-red-700 bg-red-950/40 p-4 rounded">
        <h1 className="text-lg font-semibold text-red-300">Something broke</h1>
        <p className="text-sm text-red-200/80 mt-1">
          The dashboard hit an unexpected error while rendering. Retrying usually works;
          if not, check the browser console and report it.
        </p>
        {error.message && (
          <pre className="mt-3 text-[11px] text-red-200/70 overflow-x-auto whitespace-pre-wrap">
            {error.message}
            {error.digest ? `\n(digest: ${error.digest})` : ''}
          </pre>
        )}
        <button
          onClick={() => reset()}
          className="mt-3 px-3 py-1 text-xs border border-red-700 rounded hover:bg-red-900/40"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
