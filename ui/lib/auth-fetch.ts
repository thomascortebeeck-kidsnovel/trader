import { getFirebaseAuth } from './firebase-client';

// Adds the Firebase ID token as a bearer token. Server routes can verify
// it (TODO before live trading — see lib/alpaca-server.ts).
export async function authFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const auth = getFirebaseAuth();
  const user = auth?.currentUser;
  const headers = new Headers(init.headers);
  if (user) {
    const token = await user.getIdToken();
    headers.set('Authorization', `Bearer ${token}`);
  }
  return fetch(input, { ...init, headers });
}
