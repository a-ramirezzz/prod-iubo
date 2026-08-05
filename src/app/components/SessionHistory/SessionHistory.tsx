// Copyright (c) 2025 Alan Rodrigo Ramírez Luna (@a-ramirezzz)
// Licensed under CC BY-NC-ND 4.0 — https://creativecommons.org/licenses/by-nc-nd/4.0/

/**
 * =================================================================
 * src/app/components/SessionHistory/SessionHistory.tsx
 * -----------------------------------------------------------------
 * Paginated table/card list of past completed Pomodoro sessions,
 * shown below the aggregate stats in the Focus tab. Backed by
 * useSessionHistory (date-filtered, server-paginated query).
 * =================================================================
 */

'use client';

import { useSessionHistory, type DateFilter } from '@/app/hooks/useSessionHistory';
import { useLocale } from '@/app/lib/i18n';
import styles from './SessionHistory.module.css';

interface SessionHistoryProps {
  userId: string | null;
}

const DATE_FILTERS: DateFilter[] = ['7d', '30d', '90d', 'all'];

const FILTER_KEYS: Record<DateFilter, string> = {
  '7d': 'focus.history.filter7d',
  '30d': 'focus.history.filter30d',
  '90d': 'focus.history.filter90d',
  all: 'focus.history.filterAll',
};

export default function SessionHistory({ userId }: SessionHistoryProps) {
  const { t, locale } = useLocale();
  const {
    sessions,
    isLoading,
    error,
    dateFilter,
    setDateFilter,
    page,
    totalPages,
    nextPage,
    prevPage,
    hasNextPage,
    hasPrevPage,
  } = useSessionHistory({ userId });

  if (!userId) return null;

  const dateLocale = locale === 'es' ? 'es-ES' : 'en-US';

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(dateLocale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString(dateLocale, {
      hour: '2-digit',
      minute: '2-digit',
    });

  const pageOfLabel = t('focus.history.pageOf')
    .replace('{page}', String(page + 1))
    .replace('{total}', String(totalPages));

  return (
    <section className={styles.block}>
      <h2 className={styles.blockTitle}>{t('focus.history.title')}</h2>

      <div className={styles.filterPills} role="group" aria-label={t('focus.history.title')}>
        {DATE_FILTERS.map((filter) => (
          <button
            key={filter}
            type="button"
            className={[styles.pill, dateFilter === filter ? styles.pillActive : ''].join(' ')}
            onClick={() => setDateFilter(filter)}
            aria-pressed={dateFilter === filter}
          >
            {t(FILTER_KEYS[filter])}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div role="status" aria-label={t('focus.history.loading')}>
          <div className={styles.skeleton} />
          <div className={styles.skeleton} />
          <div className={styles.skeleton} />
        </div>
      ) : error ? (
        <p className={styles.errorText}>{t('focus.history.error')}</p>
      ) : sessions.length === 0 ? (
        <p className={styles.emptyState}>{t('focus.history.empty')}</p>
      ) : (
        <>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>{t('focus.history.columnDate')}</th>
                <th>{t('focus.history.columnTime')}</th>
                <th>{t('focus.history.columnDuration')}</th>
                <th>{t('focus.history.columnTask')}</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.id}>
                  <td>{formatDate(s.completed_at)}</td>
                  <td>{formatTime(s.started_at)}</td>
                  <td>
                    {s.duration_minutes} {t('focus.history.minutes')}
                  </td>
                  <td className={styles.taskCell}>
                    {s.task_text ?? (
                      <span className={styles.noTask}>{t('focus.history.noTask')}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <ul className={styles.cardList}>
            {sessions.map((s) => (
              <li key={s.id} className={styles.card}>
                <div className={styles.cardRow}>
                  <span className={styles.cardDate}>{formatDate(s.completed_at)}</span>
                  <span className={styles.cardTime}>{formatTime(s.started_at)}</span>
                </div>
                <div className={styles.cardRow}>
                  <span className={styles.cardTask}>
                    {s.task_text ?? (
                      <span className={styles.noTask}>{t('focus.history.noTask')}</span>
                    )}
                  </span>
                  <span className={styles.cardDuration}>
                    {s.duration_minutes} {t('focus.history.minutes')}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            type="button"
            className={styles.pageButton}
            onClick={prevPage}
            disabled={!hasPrevPage}
          >
            {t('focus.history.prev')}
          </button>
          <span className={styles.pageIndicator}>{pageOfLabel}</span>
          <button
            type="button"
            className={styles.pageButton}
            onClick={nextPage}
            disabled={!hasNextPage}
          >
            {t('focus.history.next')}
          </button>
        </div>
      )}
    </section>
  );
}
