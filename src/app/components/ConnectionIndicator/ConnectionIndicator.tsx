// Copyright (c) 2025 Alan Rodrigo Ramírez Luna (@a-ramirezzz)
// Licensed under CC BY-NC-ND 4.0 — https://creativecommons.org/licenses/by-nc-nd/4.0/
'use client';

/**
 * ConnectionIndicator
 * -----------------------------------------------------------------
 * A slim, non-blocking banner fixed to the top of the viewport that
 * warns the user when the Supabase Realtime connection is lost (so
 * they know changes are not syncing) and briefly confirms when it is
 * restored. Hidden entirely while everything is healthy.
 */

import { useEffect, useRef, useState } from 'react';
import { useRealtimeStatus } from '@/hooks/useRealtimeStatus';
import { useLocale } from '@/app/lib/i18n';
import styles from './ConnectionIndicator.module.css';

const RECONNECTED_VISIBLE_MS = 3000;

export default function ConnectionIndicator() {
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
      const timeout = setTimeout(() => setShowReconnected(false), RECONNECTED_VISIBLE_MS);
      return () => clearTimeout(timeout);
    }
  }, [status]);

  const isDown = status === 'disconnected' || status === 'reconnecting';
  const visible = isDown || showReconnected;

  // Choose message + state style.
  let stateClass = styles.reconnected;
  let message = t('app.connection.reconnected');
  let icon = '✓';

  if (status === 'disconnected') {
    stateClass = styles.disconnected;
    message = t('app.connection.disconnected');
    icon = '⚠️';
  } else if (status === 'reconnecting') {
    stateClass = styles.reconnecting;
    message = t('app.connection.reconnecting');
    icon = '⚠️';
  }

  return (
    <div
      className={`${styles.banner} ${stateClass} ${visible ? styles.visible : ''}`}
      role="status"
      aria-live="polite"
      aria-hidden={!visible}
    >
      <span className={styles.icon} aria-hidden="true">{icon}</span>
      <span>{message}</span>
    </div>
  );
}
