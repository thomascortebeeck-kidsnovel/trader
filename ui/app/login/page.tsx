'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { getFirebaseAuth } from '@/lib/firebase-client';
import { USE_MOCK } from '@/lib/config';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const auth = getFirebaseAuth();
      if (!auth) throw new Error('Firebase is not configured.');
      await signInWithEmailAndPassword(auth, email, password);
      router.replace('/');
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  if (USE_MOCK) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="panel p-6 max-w-md w-full space-y-3">
          <h1 className="text-xl font-semibold">Mock mode</h1>
          <p className="text-sm text-muted">
            Firebase is not configured. The dashboard is running with mock data and
            auth is bypassed. Set <code>NEXT_PUBLIC_FIREBASE_API_KEY</code> (and the
            other Firebase vars) in <code>.env.local</code> to enable real auth.
          </p>
          <button
            className="w-full bg-blue-600 hover:bg-blue-500 rounded px-3 py-2"
            onClick={() => router.replace('/')}
          >
            Enter dashboard
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <form onSubmit={submit} className="panel p-6 max-w-md w-full space-y-3">
        <h1 className="text-xl font-semibold">Trader Dashboard</h1>
        <p className="text-sm text-muted">Operator sign-in.</p>
        <label className="block">
          <span className="stat-label">Email</span>
          <input
            type="email"
            autoComplete="email"
            className="w-full bg-panelAlt border border-border rounded px-3 py-2 mt-1"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label className="block">
          <span className="stat-label">Password</span>
          <input
            type="password"
            autoComplete="current-password"
            className="w-full bg-panelAlt border border-border rounded px-3 py-2 mt-1"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        {err && <div className="text-down text-sm">{err}</div>}
        <button
          type="submit"
          disabled={busy}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded px-3 py-2"
        >
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </main>
  );
}
