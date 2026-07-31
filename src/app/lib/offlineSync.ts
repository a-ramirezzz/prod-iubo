/**
 * =================================================================
 * src/app/lib/offlineSync.ts
 * -----------------------------------------------------------------
 * Network-first, cache-fallback read coordinator. Always tries
 * Supabase first so data is fresh whenever there's connectivity;
 * only falls back to the IndexedDB mirror (offlineDb.ts) when the
 * network read fails. Cache writes are fire-and-forget so they never
 * block the UI.
 * =================================================================
 */

import { logWarn } from '@/app/lib/logger';

export interface FetchWithOfflineFallbackOptions<T> {
  /** The primary data source — typically a Supabase query. */
  fetchFn: () => Promise<T>;
  /** Mirrors a successful network result to the local cache. */
  cacheFn: (data: T) => Promise<void>;
  /** Reads the local cache when the network fetch fails. */
  getCacheFn: () => Promise<T | null>;
  /** For logging context (e.g. 'fetchTasks'). */
  operationName: string;
}

export interface FetchWithOfflineFallbackResult<T> {
  data: T | null;
  source: 'network' | 'cache';
  error: Error | null;
}

function toError(err: unknown): Error {
  return err instanceof Error ? err : new Error(String(err));
}

export async function fetchWithOfflineFallback<T>(
  options: FetchWithOfflineFallbackOptions<T>,
): Promise<FetchWithOfflineFallbackResult<T>> {
  const { fetchFn, cacheFn, getCacheFn, operationName } = options;

  try {
    const data = await fetchFn();

    // Mirror to IndexedDB without blocking the caller.
    cacheFn(data).catch((err) =>
      logWarn('Cache write failed', {
        operation: operationName,
        metadata: { error: String(err) },
      }),
    );

    return { data, source: 'network', error: null };
  } catch (networkError) {
    try {
      const cachedData = await getCacheFn();
      if (cachedData !== null) {
        logWarn('Serving from offline cache', { operation: operationName });
        return { data: cachedData, source: 'cache', error: null };
      }
    } catch (cacheError) {
      logWarn('Cache read also failed', {
        operation: operationName,
        metadata: { error: String(cacheError) },
      });
    }

    return { data: null, source: 'network', error: toError(networkError) };
  }
}
