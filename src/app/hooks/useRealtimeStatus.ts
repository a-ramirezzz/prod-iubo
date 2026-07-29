/**
 * =================================================================
 * src/app/hooks/useRealtimeStatus.ts
 * -----------------------------------------------------------------
 * Monitors the Supabase Realtime WebSocket connection so the UI can
 * warn the user when live sync (e.g. task syncing in useTaskManager)
 * stops working.
 *
 * The installed supabase-js Realtime client does not expose public
 * onOpen/onClose/onError hooks, so we observe the connection through a
 * single, lightweight dedicated channel (Option B). It carries no
 * postgres_changes bindings — it exists only to surface the shared
 * socket's subscribe lifecycle. It never touches feature channels.
 * =================================================================
 */

import { useEffect, useState } from 'react';
import { createClient } from '@/app/lib/supabase/client';
import { logWarn } from '@/app/lib/logger';

export type RealtimeConnectionState = 'connected' | 'disconnected' | 'reconnecting';

export interface RealtimeStatus {
  status: RealtimeConnectionState;
  lastConnectedAt: Date | null;
}

/**
 * Observe the Supabase Realtime connection state.
 *
 * Starts optimistic (`connected`) and reacts to the monitor channel:
 * - `SUBSCRIBED` → `connected` (refreshes `lastConnectedAt`)
 * - `CHANNEL_ERROR` → `disconnected`
 * - `TIMED_OUT` → `reconnecting` (the client auto-retries)
 * - `CLOSED` → `reconnecting`
 */
export const useRealtimeStatus = (): RealtimeStatus => {
  const [status, setStatus] = useState<RealtimeConnectionState>('connected');
  const [lastConnectedAt, setLastConnectedAt] = useState<Date | null>(null);

  useEffect(() => {
    const supabase = createClient();

    // Move to a new state, logging the transition once (for Vercel logs).
    const transition = (next: RealtimeConnectionState) => {
      setStatus((prev) => {
        if (prev !== next) {
          logWarn('Realtime connection state changed', {
            operation: 'useRealtimeStatus',
            metadata: { from: prev, to: next },
          });
        }
        return next;
      });
    };

    const channel = supabase
      .channel('connection-monitor')
      .subscribe((subStatus) => {
        switch (subStatus) {
          case 'SUBSCRIBED':
            transition('connected');
            setLastConnectedAt(new Date());
            break;
          case 'CHANNEL_ERROR':
            transition('disconnected');
            break;
          case 'TIMED_OUT':
          case 'CLOSED':
            transition('reconnecting');
            break;
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { status, lastConnectedAt };
};
