import { NextResponse } from 'next/server';

// Typed error codes returned in API responses.
// Client code can branch on `code` to show specific messaging
// instead of a generic "something broke" blob.
export type ApiErrorCode =
  | 'unauthenticated' //   No / invalid Firebase ID token. 401.
  | 'unauthorized' //      Token valid but user not allowed. 403.
  | 'not_found' //         Requested resource doesn't exist. 404.
  | 'bad_request' //       Client sent something invalid. 400.
  | 'credentials_missing' // Server secret not set (e.g. Alpaca key). 503.
  | 'upstream_down' //     External API errored (Alpaca/GitHub). 503.
  | 'upstream_auth' //     External API rejected our creds. 502.
  | 'internal'; //         Unexpected failure. 502.

const STATUS: Record<ApiErrorCode, number> = {
  unauthenticated: 401,
  unauthorized: 403,
  not_found: 404,
  bad_request: 400,
  credentials_missing: 503,
  upstream_down: 503,
  upstream_auth: 502,
  internal: 502,
};

export class ApiError extends Error {
  constructor(
    public code: ApiErrorCode,
    message?: string,
  ) {
    super(message ?? code);
  }
}

export function apiError(
  code: ApiErrorCode,
  message?: string,
): NextResponse {
  return NextResponse.json({ code, error: message ?? code }, { status: STATUS[code] });
}

export function handleApiError(err: unknown, context: string): NextResponse {
  if (err instanceof ApiError) {
    console.error(`[${context}] ${err.code}: ${err.message}`);
    return apiError(err.code, err.message);
  }
  console.error(`[${context}] unhandled:`, err);
  return apiError('internal', err instanceof Error ? err.message : String(err));
}
