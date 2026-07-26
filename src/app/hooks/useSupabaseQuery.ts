import { useState, useEffect, useCallback, useRef } from 'react';
import { logError, logWarn } from '@/app/lib/logger';

export interface UseSupabaseQueryOptions {
  /** max retry attempts (default: 2, so 3 total attempts) */
  retries?: number;
  /** base delay for exponential backoff, in ms (default: 1000) */
  retryDelayMs?: number;
  /** whether to run the query (default: true) — useful for conditional fetching */
  enabled?: boolean;
  /** for logging context (default: 'supabaseQuery') */
  operationName?: string;
}

export interface UseSupabaseQueryResult<T> {
  data: T | null;
  error: Error | null;
  loading: boolean;
  /** manual refetch/retry — resets retry count */
  refetch: () => Promise<void>;
}

function toError(err: unknown): Error {
  return err instanceof Error ? err : new Error(String(err));
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generic Supabase fetch hook: loading → success/error → optional retry with
 * exponential backoff.
 *
 * queryFn must return the DATA directly (extract .data / check .error yourself):
 *
 *   const { data, error, loading, refetch } = useSupabaseQuery(
 *     async () => {
 *       const { data, error } = await supabase.from('tasks').select('*');
 *       if (error) throw error;
 *       return data;
 *     },
 *     { retries: 2, operationName: 'fetchTasks' },
 *   );
 */
function useSupabaseQuery<T>(
  queryFn: () => Promise<T>,
  options?: UseSupabaseQueryOptions,
): UseSupabaseQueryResult<T> {
  const {
    retries = 2,
    retryDelayMs = 1000,
    enabled = true,
    operationName = 'supabaseQuery',
  } = options ?? {};

  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(false);

  // Keep latest queryFn without re-triggering the effect on every render.
  const queryFnRef = useRef(queryFn);
  queryFnRef.current = queryFn;

  const mountedRef = useRef(true);
  // Increments on every run so stale in-flight runs (from rapid refetches or
  // enabled changes) can detect they've been superseded and skip setState.
  const runIdRef = useRef(0);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const run = useCallback(async () => {
    const runId = ++runIdRef.current;
    const isCurrent = () => mountedRef.current && runIdRef.current === runId;

    if (isCurrent()) {
      setLoading(true);
    }

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const result = await queryFnRef.current();
        if (!isCurrent()) return;
        setData(result);
        setError(null);
        setLoading(false);
        return;
      } catch (err) {
        if (!isCurrent()) return;

        const remaining = retries - attempt;
        if (remaining > 0) {
          logWarn(`retry attempt ${attempt + 1} of ${retries}`, {
            operation: operationName,
            metadata: { attempt: attempt + 1, remaining },
          });
          await delay(retryDelayMs * 2 ** attempt);
          if (!isCurrent()) return;
          continue;
        }

        // No retries remaining.
        logError(err, {
          operation: operationName,
          metadata: { attempts: attempt + 1 },
        });
        setError(toError(err));
        setLoading(false);
        return;
      }
    }
  }, [retries, retryDelayMs, operationName]);

  useEffect(() => {
    if (!enabled) return;
    void run();
    // Re-run when enabled flips to true or the run identity changes.
  }, [enabled, run]);

  const refetch = useCallback(async () => {
    await run();
  }, [run]);

  return { data, error, loading, refetch };
}

export default useSupabaseQuery;
