/**
 * =================================================================
 * src/app/lib/syncProcessor.ts
 * -----------------------------------------------------------------
 * Replays queued mutations (offlineMutation.ts → syncQueue store)
 * against Supabase once the connection is back. Entries are
 * processed strictly in FIFO order — order matters, e.g. a task
 * create must land before an edit to that same task.
 * =================================================================
 */

import { createClient } from '@/app/lib/supabase/client';
import {
  getPendingQueueEntries,
  updateQueueEntryStatus,
  removeQueueEntry,
  type SyncQueueEntry,
} from '@/app/lib/offlineDb';
import { logError, logWarn } from '@/app/lib/logger';
import { SYNC } from '@/app/lib/constants';

export interface SyncResult {
  processed: number;
  failed: number;
  remaining: number;
}

type SupabaseClient = ReturnType<typeof createClient>;

export async function processSyncQueue(userId: string): Promise<SyncResult> {
  const entries = await getPendingQueueEntries(userId);
  if (entries.length === 0) return { processed: 0, failed: 0, remaining: 0 };

  const supabase = createClient();
  let processed = 0;
  let failed = 0;

  // Process entries IN ORDER (FIFO) — order matters for consistency.
  for (const entry of entries) {
    if (entry.id === undefined) continue;

    try {
      await updateQueueEntryStatus(entry.id, 'processing');
      await executeSyncEntry(supabase, entry);
      await removeQueueEntry(entry.id);
      processed++;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const retryCount = entry.retryCount + 1;

      if (retryCount >= SYNC.MAX_RETRIES) {
        await updateQueueEntryStatus(entry.id, 'failed', message, retryCount);
        failed++;
        logError(error, {
          operation: 'syncProcessor',
          userId,
          metadata: { table: entry.table, entryId: entry.id, retryCount },
        });
      } else {
        await updateQueueEntryStatus(entry.id, 'pending', message, retryCount);
        logWarn('Sync entry will retry', {
          operation: 'syncProcessor',
          userId,
          metadata: { table: entry.table, entryId: entry.id, retryCount },
        });
      }
    }
  }

  const remaining = entries.length - processed - failed;
  return { processed, failed, remaining };
}

async function executeSyncEntry(supabase: SupabaseClient, entry: SyncQueueEntry): Promise<void> {
  switch (entry.operation) {
    case 'insert': {
      const { error } = await supabase.from(entry.table).insert(entry.data);
      if (error) throw error;
      break;
    }
    case 'update': {
      let query = supabase.from(entry.table).update(entry.data);
      if (entry.filters) {
        for (const [key, value] of Object.entries(entry.filters)) {
          query = query.eq(key, value as string);
        }
      }
      const { error } = await query;
      if (error) throw error;
      break;
    }
    case 'delete': {
      let query = supabase.from(entry.table).delete();
      if (entry.filters) {
        for (const [key, value] of Object.entries(entry.filters)) {
          query = query.eq(key, value as string);
        }
      }
      const { error } = await query;
      if (error) throw error;
      break;
    }
    case 'upsert': {
      const { error } = await supabase.from(entry.table).upsert(entry.data, { onConflict: 'id' });
      if (error) throw error;
      break;
    }
  }
}
