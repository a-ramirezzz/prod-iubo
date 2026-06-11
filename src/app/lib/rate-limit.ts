// Copyright (c) 2025 Alan Rodrigo Ramírez Luna (@a-ramirezzz)
// Licensed under CC BY-NC-ND 4.0 — https://creativecommons.org/licenses/by-nc-nd/4.0/

const DEFAULT_WINDOW_MS = 60 * 1000;
const DEFAULT_MAX_REQUESTS = 5;

interface RateLimitEntry {
  count: number;
  firstRequest: number;
}

export function createRateLimiter(windowMs = DEFAULT_WINDOW_MS, maxRequests = DEFAULT_MAX_REQUESTS) {
  const map = new Map<string, RateLimitEntry>();

  function cleanup(now: number) {
    for (const [key, val] of map.entries()) {
      if (now - val.firstRequest > windowMs) {
        map.delete(key);
      }
    }
  }

  function isRateLimited(ip: string): boolean {
    const now = Date.now();
    const entry = map.get(ip);

    if (Math.random() < 0.01) {
      cleanup(now);
    }

    if (!entry || now - entry.firstRequest > windowMs) {
      map.set(ip, { count: 1, firstRequest: now });
      return false;
    }

    entry.count++;
    return entry.count > maxRequests;
  }

  function reset() {
    map.clear();
  }

  return { isRateLimited, reset };
}
