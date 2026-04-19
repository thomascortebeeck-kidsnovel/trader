'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { getFirebaseAuth } from '@/lib/firebase-client';
import { USE_MOCK } from '@/lib/config';

export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(USE_MOCK);

  useEffect(() => {
    if (USE_MOCK) return;
    const auth = getFirebaseAuth();
    if (!auth) {
      setReady(true);
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

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted text-sm">
        loading…
      </div>
    );
  }

  if (!USE_MOCK && !user && pathname !== '/login') {
    return null;
  }

  return <>{children}</>;
}
