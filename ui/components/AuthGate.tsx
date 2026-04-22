'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { getFirebaseAuth } from '@/lib/firebase-client';
import { AUTH_REQUIRED, CONFIG_OK, USE_MOCK } from '@/lib/config';

export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(USE_MOCK);

  useEffect(() => {
    if (USE_MOCK) return;
    const auth = getFirebaseAuth();
    if (!auth) {
      // Firebase should have initialised — if it didn't, we must not
      // silently drop into open-access mode. Leave ready=false so the
      // misconfig screen below renders.
      return;
    }
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setReady(true);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (USE_MOCK) return;
    if (!ready) return;
    if (!user && pathname !== '/login') {
      router.replace('/login');
    }
    if (user && pathname === '/login') {
      router.replace('/');
    }
  }, [ready, user, pathname, router]);

  // Production misconfig: auth is required but Firebase isn't configured.
  // Render a loud error instead of defaulting to open access.
  if (AUTH_REQUIRED && !CONFIG_OK) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md border border-red-700 bg-red-950/40 p-4 rounded text-sm">
          <div className="font-semibold text-red-300 mb-2">Configuration error</div>
          <p className="text-red-200/80">
            Firebase Auth is not configured (missing <code>NEXT_PUBLIC_FIREBASE_*</code> build-time
            env vars). Refusing to serve the dashboard in open-access mode. Check the deploy
            workflow secrets and rebuild.
          </p>
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted text-sm">
        loading…
      </div>
    );
  }

  if (AUTH_REQUIRED && !user && pathname !== '/login') {
    return null;
  }

  return <>{children}</>;
}
