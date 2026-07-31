/**
 * =================================================================
 * src/app/lib/offlineMutation.ts
 * -----------------------------------------------------------------
 * Wraps a Supabase write with an offline fallback: if it fails
 * because the network is unavailable, the mutation is queued in
 * IndexedDB (syncQueue store) for syncProcessor.ts to replay once
 * the connection returns. Data-level errors (constraint violations,
 * RLS denials, validation) are surfaced as-is and never queued —
 * retrying them would just fail again.
 * =================================================================
 */

import { addToSyncQueue, type SyncQueueEntry } from '@/app/lib/offlineDb';
import { logWarn } from '@/app/lib/logger';

export interface MutationOptions {
  table: SyncQueueEntry['table'];
  operation: SyncQueueEntry['operation'];
  data: Record<string, unknown>;
  filters?: Record<string, unknown>;
  userId: string;
}

/** The subset of a Supabase/PostgrestError shape this module cares about. */
export interface SupabaseErrorLike {
  message?: string;
  code?: string;
  status?: number;
}

export interface ExecuteOrQueueResult {
  queued: boolean;
  error: SupabaseErrorLike | null;
}

/**
 * True network failures (offline, DNS, CORS) make the underlying fetch()
 * reject — those are caught by the outer try/catch below and always queued.
 * If we get here, the request actually reached the server and resolved with
 * an error response, so this is conservative: only messages that clearly
 * indicate a connectivity problem are treated as retryable: everything else
 * (constraint violations, RLS denials, PostgREST data errors) surfaces
 * immediately rather than being queued for a retry that would just fail again.
 */
function isNetworkError(error: SupabaseErrorLike): boolean {
  if (error.code?.startsWith('PGRST')) return false;
  if (typeof error.status === 'number' && error.status >= 400) return false;
  const msg = (error.message ?? '').toLowerCase();
  return msg.includes('fetch') || msg.includes('network') || msg.includes('offline');
}

/**
 * Runs a Supabase mutation. On success, resolves normally. On a network
 * failure, queues the equivalent operation in IndexedDB and reports
 * `queued: true` so the caller can keep its optimistic state and mirror it
 * into the local cache.
 */
export async function executeOrQueue(
  supabaseFn: () => PromiseLike<{ error: SupabaseErrorLike | null }>,
  queueOptions: MutationOptions,
): Promise<ExecuteOrQueueResult> {
  try {
    const result = await supabaseFn();
    if (result.error) {
      if (isNetworkError(result.error)) {
        await addToSyncQueue(queueOptions);
        logWarn('Mutation queued for offline sync', {
          operation: queueOptions.operation,
          userId: queueOptions.userId,
          metadata: { table: queueOptions.table },
        });
        return { queued: true, error: null };
      }
      return { queued: false, error: result.error };
    }
    return { queued: false, error: null };
  } catch (error) {
    // The fetch itself threw — a genuine network-level failure.
    await addToSyncQueue(queueOptions);
    logWarn('Mutation queued for offline sync (network exception)', {
      operation: queueOptions.operation,
      userId: queueOptions.userId,
      metadata: { table: queueOptions.table, error: String(error) },
    });
    return { queued: true, error: null };
  }
}
