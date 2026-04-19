// Single source of truth for "is this environment wired up?"
// Mock mode activates automatically when Firebase env vars are missing,
// so the app runs zero-config for preview.

export const firebaseClientConfigured =
  typeof process.env.NEXT_PUBLIC_FIREBASE_API_KEY === 'string' &&
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY.length > 0;

export const USE_MOCK = !firebaseClientConfigured;
