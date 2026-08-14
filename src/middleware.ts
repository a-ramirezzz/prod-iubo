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

export async function middleware(request: NextRequest) {
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

  return await updateSession(request);
}

export const config = {
  matcher: ['/app/:path*', '/login', '/signup', '/forgot-password', '/reset-password'],
};
