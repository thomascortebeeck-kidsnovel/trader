// Single source of truth for "is this environment wired up?"
//
// In production we REQUIRE Firebase config. If `NEXT_PUBLIC_REQUIRE_AUTH`
// is set (or NODE_ENV is 'production' and Firebase vars are present), the
// app refuses to run in mock mode — a misconfigured deploy fails loud
// instead of silently downgrading to open-access.

const firebaseApiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

export const firebaseClientConfigured =
  typeof firebaseApiKey === 'string' && firebaseApiKey.length > 0;

/**
 * Whether auth is required. In production this defaults to true — the
 * dashboard must have Firebase Auth wired up. In dev / preview, it's
 * opt-in via NEXT_PUBLIC_REQUIRE_AUTH=true.
 */
export const AUTH_REQUIRED =
  process.env.NODE_ENV === 'production' ||
  process.env.NEXT_PUBLIC_REQUIRE_AUTH === 'true';

/**
 * Mock mode is only allowed when auth isn't required AND Firebase
 * isn't configured. In production this is ALWAYS false, which means:
 *   - A misconfigured prod deploy (missing NEXT_PUBLIC_FIREBASE_API_KEY)
 *     will fail hard rather than silently bypass auth.
 *   - API routes will return typed 401/503 errors instead of mock data.
 */
export const USE_MOCK = !AUTH_REQUIRED && !firebaseClientConfigured;

/**
 * True when the app is configured correctly to serve real data.
 * AuthGate and routes use this to decide whether to show a hard error
 * page vs. proceed normally.
 */
export const CONFIG_OK = firebaseClientConfigured || !AUTH_REQUIRED;
