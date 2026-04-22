import { getFirebaseAuth } from './firebase-client';

export interface FetchResult<T> {
  ok: boolean;
  status: number;
  data: T | null;
  error: { code: string; message: string } | null;
}

/**
 * Adds the Firebase ID token as a bearer token and returns a structured
 * result. Server routes reject requests without a valid token when
 * AUTH_REQUIRED is set on the server.
 */
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

/**
 * High-level wrapper: returns `{ ok, data, error }` so callers don't have
 * to duplicate try/catch + status-check around every fetch. On 4xx/5xx
 * responses the body is expected to be `{ code, error }`.
 */
export async function authFetchJSON<T>(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<FetchResult<T>> {
  try {
    const res = await authFetch(input, init);
    if (!res.ok) {
      let code = 'http_error';
      let message = `HTTP ${res.status}`;
      try {
        const body = (await res.json()) as { code?: string; error?: string };
        if (body.code) code = body.code;
        if (body.error) message = body.error;
      } catch {
        /* non-JSON error body; keep defaults */
      }
      return { ok: false, status: res.status, data: null, error: { code, message } };
    }
    const data = (await res.json()) as T;
    return { ok: true, status: res.status, data, error: null };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      data: null,
      error: { code: 'network_error', message: err instanceof Error ? err.message : String(err) },
    };
  }
}
