// Copyright (c) 2025 Alan Rodrigo Ramírez Luna (@a-ramirezzz)
// Licensed under CC BY-NC-ND 4.0 — https://creativecommons.org/licenses/by-nc-nd/4.0/
'use client';

/**
 * ConnectionIndicator
 * -----------------------------------------------------------------
 * A slim, non-blocking banner fixed to the top of the viewport. Two
 * signals feed into it:
 *  - the Supabase Realtime connection (useRealtimeStatus): warns when
 *    lost, briefly confirms when restored.
 *  - the offline mutation queue (useSyncQueue, passed in as props):
 *    surfaces syncing progress and permanently failed entries.
 * Hidden entirely while everything is healthy — the offline system is
 * invisible unless it needs the user's attention.
 */

import { memo, useEffect, useRef, useState } from 'react';
import { useRealtimeStatus } from '@/hooks/useRealtimeStatus';
import { useLocale } from '@/app/lib/i18n';
import { SYNC } from '@/app/lib/constants';
import styles from './ConnectionIndicator.module.css';

interface ConnectionIndicatorProps {
  /** Queued mutations awaiting sync (from useSyncQueue). */
  pendingCount?: number;
  /** Whether the queue is actively being replayed right now. */
  isSyncing?: boolean;
  /** Entries that exhausted their retries and need manual attention. */
  failedCount?: number;
  /** How many entries the last sync run processed successfully. */
  lastSyncedCount?: number;
  /** Opens the sync details panel — required to show the failed-state link. */
  onOpenSyncDetails?: () => void;
}

function ConnectionIndicator({
  pendingCount = 0,
  isSyncing = false,
  failedCount = 0,
  lastSyncedCount = 0,
  onOpenSyncDetails,
}: ConnectionIndicatorProps) {
  const { status } = useRealtimeStatus();
  const { t } = useLocale();

  // Whether to show the transient "reconnected" success banner.
  const [showReconnected, setShowReconnected] = useState(false);
  // Track the previous status to detect a recovery edge.
  const prevStatusRef = useRef(status);

  useEffect(() => {
    const prev = prevStatusRef.current;
    prevStatusRef.current = status;

    // Detect the transition FROM a bad state TO connected.
    if (status === 'connected' && (prev === 'disconnected' || prev === 'reconnecting')) {
      setShowReconnected(true);
      const timeout = setTimeout(() => setShowReconnected(false), SYNC.RECONNECTED_VISIBLE_MS);
      return () => clearTimeout(timeout);
    }
  }, [status]);

  const isDown = status === 'disconnected' || status === 'reconnecting';

  // Priority: connection down > actively syncing > permanent failures >
  // transient "just reconnected" success > hidden.
  let stateClass = styles.reconnected;
  let message = '';
  let icon = '✓';
  let visible = false;
  let showDetailsLink = false;

  if (isDown) {
    visible = true;
    stateClass = status === 'disconnected' ? styles.disconnected : styles.reconnecting;
    icon = '⚠️';
    message =
      status === 'disconnected' ? t('app.connection.disconnected') : t('app.connection.reconnecting');
    if (pendingCount > 0) {
      message += t('app.connection.pendingWhileOffline').replace('{count}', String(pendingCount));
    }
  } else if (isSyncing) {
    visible = true;
    stateClass = styles.syncing;
    message = t('app.connection.syncing').replace('{count}', String(pendingCount + failedCount));
  } else if (failedCount > 0) {
    visible = true;
    stateClass = styles.failed;
    icon = '⚠️';
    message = t('app.connection.syncFailed').replace('{count}', String(failedCount));
    showDetailsLink = true;
  } else if (showReconnected) {
    visible = true;
    stateClass = styles.reconnected;
    icon = '✓';
    message =
      lastSyncedCount > 0
        ? t('app.connection.syncComplete').replace('{count}', String(lastSyncedCount))
        : t('app.connection.reconnected');
  }

  return (
    <div
      className={`${styles.banner} ${stateClass} ${visible ? styles.visible : ''}`}
      role="status"
      aria-live="polite"
      aria-hidden={!visible}
    >
      {isSyncing ? (
        <span className={styles.spinner} aria-hidden="true" />
      ) : (
        <span className={styles.icon} aria-hidden="true">{icon}</span>
      )}
      <span>{message}</span>
      {showDetailsLink && onOpenSyncDetails && (
        <button type="button" className={styles.detailsLink} onClick={onOpenSyncDetails}>
          {t('app.sync.viewDetails')}
        </button>
      )}
    </div>
  );
}

// Memoized: page.tsx re-renders every timer tick, but this banner's props
// (sync/connection counters) only change on actual sync/connection events.
export default memo(ConnectionIndicator);
