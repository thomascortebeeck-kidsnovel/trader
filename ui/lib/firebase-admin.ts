// Server-only. Verifies the Firebase ID token attached to API requests
// so an unauthenticated client can't read Alpaca balances or memory files
// even if the Cloud Run URL leaks or ingress is ever opened.
//
// On Cloud Run, the default runtime service account's credentials are
// picked up automatically via ADC (Application Default Credentials) —
// no JSON key file needed.

import { cert, getApps, initializeApp, applicationDefault, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { ApiError } from './api-errors';

let _app: App | null = null;

function getApp(): App | null {
  if (_app) return _app;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? process.env.FIREBASE_PROJECT_ID;
  if (!projectId) return null;
  const existing = getApps()[0];
  if (existing) {
    _app = existing;
    return _app;
  }
  try {
    _app = initializeApp({
      credential: applicationDefault(),
      projectId,
    });
  } catch (err) {
    console.warn('[firebase-admin] init failed:', err);
    return null;
  }
  return _app;
}

/**
 * Verify the Authorization: Bearer <id_token> header on a request.
 * Throws ApiError('unauthenticated') if the token is missing or invalid.
 *
 * In dev / preview environments where NEXT_PUBLIC_FIREBASE_PROJECT_ID
 * isn't set, this is a no-op and callers proceed as if the request was
 * authenticated. The production check is enforced by `config.ts`, which
 * fails the build if the project ID is missing.
 */
export async function requireAuthenticatedUser(req: Request): Promise<{ uid: string } | null> {
  const app = getApp();
  if (!app) return null; // dev / preview mode, gate is client-side only

  const header = req.headers.get('authorization') ?? '';
  const match = header.match(/^Bearer\s+(\S+)$/i);
  if (!match) throw new ApiError('unauthenticated', 'missing bearer token');

  try {
    const decoded = await getAuth(app).verifyIdToken(match[1]);
    return { uid: decoded.uid };
  } catch (err) {
    throw new ApiError('unauthenticated', `token verification failed: ${String(err)}`);
  }
}

// Re-export cert for optional use when ADC isn't available
export { cert };
