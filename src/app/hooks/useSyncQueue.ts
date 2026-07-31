/**
 * =================================================================
 * src/app/hooks/useSyncQueue.ts
 * -----------------------------------------------------------------
 * Mounts the offline-mutation sync lifecycle: watches the Realtime
 * connection status, and once it transitions back to "connected"
 * (after a brief stabilization delay) replays any queued mutations
 * against Supabase.
 * =================================================================
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { processSyncQueue, type SyncResult } from '@/app/lib/syncProcessor';
import { getQueueSize } from '@/app/lib/offlineDb';
import { useRealtimeStatus } from '@/app/hooks/useRealtimeStatus';
import { logWarn } from '@/app/lib/logger';

// Let the connection settle before hammering it with queued writes.
const RECONNECT_STABILIZE_MS = 1500;

export interface UseSyncQueueResult {
  pendingCount: number;
  isSyncing: boolean;
  lastSyncResult: SyncResult | null;
  syncNow: () => Promise<void>;
}

export function useSyncQueue(userId: string | null): UseSyncQueueResult {
  const { status } = useRealtimeStatus();
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null);

  const userIdRef = useRef(userId);
  userIdRef.current = userId;
  const isSyncingRef = useRef(false);
  const prevStatusRef = useRef(status);

  const refreshPendingCount = useCallback(async () => {
    const uid = userIdRef.current;
    if (!uid) {
      setPendingCount(0);
      return;
    }
    const size = await getQueueSize(uid);
    setPendingCount(size);
  }, []);

  const syncNow = useCallback(async () => {
    const uid = userIdRef.current;
    if (!uid || isSyncingRef.current) return;

    isSyncingRef.current = true;
    setIsSyncing(true);
    try {
      const result = await processSyncQueue(uid);
      setLastSyncResult(result);
      if (result.processed > 0 || result.failed > 0) {
        logWarn('Sync queue processed', {
          operation: 'useSyncQueue',
          userId: uid,
          metadata: { ...result },
        });
      }
    } finally {
      isSyncingRef.current = false;
      setIsSyncing(false);
      await refreshPendingCount();
    }
  }, [refreshPendingCount]);

  // Refresh the pending count whenever the signed-in user changes.
  useEffect(() => {
    refreshPendingCount();
  }, [userId, refreshPendingCount]);

  // Auto-sync when the realtime connection transitions back to "connected".
  useEffect(() => {
    const prevStatus = prevStatusRef.current;
    prevStatusRef.current = status;
    if (!userId) return;
    if (status === 'connected' && prevStatus !== 'connected') {
      const timer = setTimeout(() => {
        syncNow();
      }, RECONNECT_STABILIZE_MS);
      return () => clearTimeout(timer);
    }
  }, [status, userId, syncNow]);

  return { pendingCount, isSyncing, lastSyncResult, syncNow };
}
