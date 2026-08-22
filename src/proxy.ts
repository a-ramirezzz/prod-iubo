// Copyright (c) 2025 Alan Rodrigo Ramírez Luna (@a-ramirezzz)
// Licensed under CC BY-NC-ND 4.0 — https://creativecommons.org/licenses/by-nc-nd/4.0/

import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/app/lib/supabase/middleware';
import { createRateLimiter } from '@/app/lib/rate-limit';

const AUTH_RATE_LIMITERS: Record<string, ReturnType<typeof createRateLimiter>> = {
  '/login': createRateLimiter(15 * 60 * 1000, 10),
  '/signup': createRateLimiter(15 * 60 * 1000, 5),
  '/forgot-password': createRateLimiter(15 * 60 * 1000, 3),
  '/reset-password': createRateLimiter(15 * 60 * 1000, 5),
};

// Paths that need Supabase session refresh / the /app auth-gate redirect.
// Kept identical to the previous middleware matcher so broadening CSP to
// every route below doesn't change auth behavior on unrelated pages.
const SESSION_PATH_PREFIXES = ['/app', '/login', '/signup', '/forgot-password', '/reset-password'];

function needsSessionRefresh(pathname: string): boolean {
  return SESSION_PATH_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

/**
 * Builds the Content-Security-Policy value for a request.
 *
 * Nonce-based `script-src`/`style-src` with `'strict-dynamic'` so Next.js's
 * own framework/page scripts (which it nonces automatically once it detects
 * the nonce in this header) can load their own dependencies. External hosts
 * are limited to what the app actually talks to: Supabase (REST + Realtime
 * websocket), Sentry error ingestion, and the two image hosts configured in
 * `images.remotePatterns` (next.config.mts).
 */
function buildCsp(nonce: string, isDev: boolean): string {
  const directives = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ''}`,
    `style-src 'self' 'nonce-${nonce}'`,
    "img-src 'self' data: blob: https://placehold.co https://images.unsplash.com",
    "font-src 'self'",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.ingest.us.sentry.io",
    "media-src 'self' blob: data:",
    "worker-src 'self'",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
  ];

  return directives.join('; ');
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const limiter = AUTH_RATE_LIMITERS[pathname];

  if (request.method === 'POST' && limiter) {
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
    const key = `auth:${pathname.slice(1)}:${ip}`;

    if (limiter.isRateLimited(key)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(limiter.getRetryAfterSeconds(key)),
          },
        }
      );
    }
  }

  const nonce = crypto.randomUUID();
  const isDev = process.env.NODE_ENV === 'development';
  // Playwright's addStyleTag() injects unnonced inline styles, which the
  // strict CSP rejects. Visual tests always run against a local dev/build
  // server (never against the deployed app), so skipping the header when
  // this flag is set can't relax the CSP that real users see.
  const skipCsp = process.env.PLAYWRIGHT === 'true';
  const csp = skipCsp ? null : buildCsp(nonce, isDev);
  const cspHeaderName = isDev ? 'Content-Security-Policy-Report-Only' : 'Content-Security-Policy';

  // updateSession gets the pristine, unmodified request — it may need to
  // read/clone the body of a POST (login/signup forms), and Request bodies
  // can only be consumed once, so the nonce/CSP headers are layered on
  // afterwards instead of being threaded through it.
  const authResponse = needsSessionRefresh(pathname) ? await updateSession(request) : null;

  // A redirect (e.g. expired session -> /login) doesn't render anything
  // itself, so it doesn't need a nonce — just forward the CSP header and
  // let the redirected request pick up a fresh nonce.
  if (authResponse?.headers.get('location')) {
    if (csp) authResponse.headers.set(cspHeaderName, csp);
    return authResponse;
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  if (csp) requestHeaders.set(cspHeaderName, csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });

  // Carry forward the Supabase session-refresh cookies, if any.
  authResponse?.headers.forEach((value, key) => {
    if (key.toLowerCase() === 'set-cookie') {
      response.headers.append('set-cookie', value);
    }
  });

  if (csp) response.headers.set(cspHeaderName, csp);
  response.headers.set('x-nonce', nonce);

  return response;
}

export const config = {
  matcher: [
    /*
     * Run on every page request so the nonce-based CSP applies app-wide,
     * excluding Next.js internals, the service worker, and static assets
     * (which don't render HTML and don't need a nonce).
     */
    {
      source: '/((?!_next/static|_next/image|api|sw\\.js|favicon\\.ico|manifest\\.json|.*\\.(?:png|jpg|jpeg|svg|ico|webp|mp3|mp4|webm|woff2?)$).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
