'use client';
// Copyright (c) 2025 Alan Rodrigo Ramírez Luna (@a-ramirezzz)
// Licensed under CC BY-NC-ND 4.0 — https://creativecommons.org/licenses/by-nc-nd/4.0/
// src/app/components/SyncDetailsPanel/SyncDetailsPanel.tsx

/**
 * SyncDetailsPanel
 * -----------------------------------------------------------------
 * Lets the user inspect the offline mutation queue (Step 3) and take
 * action on entries that failed to sync: retry individually, retry
 * everything, or discard (with confirmation, since it's data loss).
 * Only ever opened explicitly from ConnectionIndicator's "Ver detalles"
 * link — never shown automatically.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocale } from '@/app/lib/i18n';
import {
  getPendingQueueEntries,
  removeQueueEntry,
  updateQueueEntryStatus,
  clearSyncQueue,
  type SyncQueueEntry,
} from '@/app/lib/offlineDb';
import styles from './SyncDetailsPanel.module.css';

interface SyncDetailsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
  /** Triggers an immediate sync pass (from useSyncQueue) — used by the retry actions. */
  onSyncNow?: () => Promise<void>;
}

const TABLE_ICONS: Record<SyncQueueEntry['table'], string> = {
  pomodoro_sessions: '📊',
  tasks: '✅',
  user_settings: '⚙️',
};

const TABLE_LABEL_KEYS: Record<SyncQueueEntry['table'], string> = {
  pomodoro_sessions: 'app.sync.tableSessions',
  tasks: 'app.sync.tableTasks',
  user_settings: 'app.sync.tableSettings',
};

const OPERATION_LABEL_KEYS: Record<SyncQueueEntry['operation'], string> = {
  insert: 'app.sync.operationInsert',
  update: 'app.sync.operationUpdate',
  delete: 'app.sync.operationDelete',
  upsert: 'app.sync.operationUpsert',
};

function relativeTime(iso: string, t: (key: string) => string): string {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  if (minutes < 1) return t('app.sync.timeJustNow');

  let unit: string;
  if (minutes < 60) {
    unit = t('app.sync.timeMinutes').replace('{n}', String(minutes));
  } else if (minutes < 60 * 24) {
    unit = t('app.sync.timeHours').replace('{n}', String(Math.floor(minutes / 60)));
  } else {
    unit = t('app.sync.timeDays').replace('{n}', String(Math.floor(minutes / (60 * 24))));
  }
  return t('app.sync.timeAgo').replace('{time}', unit);
}

export default function SyncDetailsPanel({ isOpen, onClose, userId, onSyncNow }: SyncDetailsPanelProps) {
  const { t } = useLocale();
  const modalRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  const [entries, setEntries] = useState<SyncQueueEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [confirmDiscardId, setConfirmDiscardId] = useState<number | null>(null);
  const [confirmDiscardAll, setConfirmDiscardAll] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) {
      setEntries([]);
      return;
    }
    setLoading(true);
    try {
      const rows = await getPendingQueueEntries(userId);
      setEntries(rows);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (isOpen) {
      refresh();
    } else {
      setConfirmDiscardId(null);
      setConfirmDiscardAll(false);
    }
  }, [isOpen, refresh]);

  // On open: remember focus, move it into the panel. On close: restore it.
  useEffect(() => {
    if (isOpen) {
      previouslyFocused.current = document.activeElement as HTMLElement | null;
      closeRef.current?.focus();
    } else if (previouslyFocused.current) {
      previouslyFocused.current.focus();
      previouslyFocused.current = null;
    }
  }, [isOpen]);

  // Escape to close + a minimal Tab focus trap scoped to the panel.
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === 'Tab') {
        const focusables = modalRef.current?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusables || focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement;
        if (e.shiftKey && active === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  const handleRetrySingle = async (id?: number) => {
    if (id === undefined) return;
    setBusyId(id);
    try {
      await updateQueueEntryStatus(id, 'pending');
      await onSyncNow?.();
      await refresh();
    } finally {
      setBusyId(null);
    }
  };

  const handleDiscardSingle = async (id?: number) => {
    if (id === undefined) return;
    if (confirmDiscardId !== id) {
      setConfirmDiscardId(id);
      return;
    }
    setConfirmDiscardId(null);
    await removeQueueEntry(id);
    await refresh();
  };

  const handleRetryAll = async () => {
    await onSyncNow?.();
    await refresh();
  };

  const handleDiscardAll = async () => {
    if (!confirmDiscardAll) {
      setConfirmDiscardAll(true);
      return;
    }
    setConfirmDiscardAll(false);
    if (userId) await clearSyncQueue(userId);
    await refresh();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        ref={modalRef}
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sync-details-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <h2 id="sync-details-title" className={styles.title}>
            {t('app.sync.detailsTitle')}
          </h2>
          <button
            ref={closeRef}
            className={styles.closeButton}
            onClick={onClose}
            aria-label={t('app.sync.closeAria')}
          >
            ✕
          </button>
        </div>

        <div className={styles.body}>
          {!loading && entries.length === 0 && (
            <div className={styles.emptyState}>{t('app.sync.allSynced')}</div>
          )}

          {entries.map((entry) => (
            <div key={entry.id} className={styles.entry}>
              <span className={styles.entryIcon} aria-hidden="true">
                {TABLE_ICONS[entry.table]}
              </span>
              <div className={styles.entryInfo}>
                <div className={styles.entryOperation}>
                  {t(OPERATION_LABEL_KEYS[entry.operation])} · {t(TABLE_LABEL_KEYS[entry.table])}
                </div>
                <div className={styles.entryMeta}>
                  <span
                    className={`${styles.statusBadge} ${
                      entry.status === 'failed' ? styles.statusFailed : styles.statusPending
                    }`}
                  >
                    {entry.status === 'failed' ? t('app.sync.statusFailed') : t('app.sync.statusPending')}
                  </span>
                  {' · '}
                  {relativeTime(entry.createdAt, t)}
                </div>
                {entry.status === 'failed' && entry.lastError && (
                  <div className={styles.entryError}>
                    {t('app.sync.errorLabel')}: {entry.lastError}
                  </div>
                )}
                {entry.status === 'failed' && (
                  <div className={styles.entryActions}>
                    <button
                      type="button"
                      className={styles.retryButton}
                      onClick={() => handleRetrySingle(entry.id)}
                      disabled={busyId === entry.id}
                    >
                      {t('app.sync.retrySingle')}
                    </button>
                    <button
                      type="button"
                      className={styles.discardButton}
                      onClick={() => handleDiscardSingle(entry.id)}
                    >
                      {confirmDiscardId === entry.id
                        ? t('app.sync.discardConfirm')
                        : t('app.sync.discardSingle')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {entries.length > 0 && (
          <div className={styles.footer}>
            <button type="button" className={styles.retryButton} onClick={handleRetryAll}>
              {t('app.sync.retryAll')}
            </button>
            <button type="button" className={styles.discardButton} onClick={handleDiscardAll}>
              {confirmDiscardAll ? t('app.sync.discardAllConfirm') : t('app.sync.discardAll')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
