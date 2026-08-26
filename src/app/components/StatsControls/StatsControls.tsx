// Copyright (c) 2025 Alan Rodrigo Ramírez Luna (@a-ramirezzz)
// Licensed under CC BY-NC-ND 4.0 — https://creativecommons.org/licenses/by-nc-nd/4.0/
// src/app/components/StatsControls/StatsControls.tsx

'use client';

import { useState } from 'react';
import styles from './StatsControls.module.css';
import { useLocale } from '@/app/lib/i18n';
import { localDateStr, type SessionRow, type StatsPeriod } from '@/app/hooks/usePomodoroStats';

interface StatsControlsProps {
  period: StatsPeriod;
  onPeriodChange: (period: StatsPeriod) => void;
  sessions: SessionRow[];
}

const PERIODS: StatsPeriod[] = ['7d', '30d', '90d', '1y', 'all'];

const PERIOD_KEYS: Record<StatsPeriod, string> = {
  '7d': 'focus.periodFilter.7d',
  '30d': 'focus.periodFilter.30d',
  '90d': 'focus.periodFilter.90d',
  '1y': 'focus.periodFilter.1y',
  all: 'focus.periodFilter.all',
};

/** Quotes a field only when it contains a comma, quote or newline (RFC 4180). */
function csvField(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

const formatHHMM = (iso: string) => {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

function sessionsToCsv(sessions: SessionRow[], headers: string[]): string {
  const rows = sessions.map((s) =>
    [
      localDateStr(new Date(s.completed_at)),
      formatHHMM(s.started_at),
      String(s.duration_minutes),
      s.session_type,
      s.task_text ?? '',
    ]
      .map(csvField)
      .join(',')
  );
  return [headers.map(csvField).join(','), ...rows].join('\n');
}

export default function StatsControls({ period, onPeriodChange, sessions }: StatsControlsProps) {
  const { t } = useLocale();
  const [justExported, setJustExported] = useState(false);

  const handleExport = () => {
    const headers = [
      t('focus.export.columnDate'),
      t('focus.export.columnStartTime'),
      t('focus.export.columnDuration'),
      t('focus.export.columnType'),
      t('focus.export.columnTask'),
    ];
    const csv = sessionsToCsv(sessions, headers);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pomodoro-stats-${period}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    setJustExported(true);
    setTimeout(() => setJustExported(false), 1000);
  };

  return (
    <div className={styles.controls}>
      <div className={styles.filterPills} role="group" aria-label={t('focus.periodFilter.label')}>
        {PERIODS.map((p) => (
          <button
            key={p}
            type="button"
            className={[styles.pill, period === p ? styles.pillActive : ''].join(' ')}
            onClick={() => onPeriodChange(p)}
            aria-pressed={period === p}
          >
            {t(PERIOD_KEYS[p])}
          </button>
        ))}
      </div>
      <button
        type="button"
        className={[styles.exportButton, justExported ? styles.exportButtonSuccess : ''].join(' ')}
        onClick={handleExport}
      >
        {justExported ? `✓ ${t('focus.export.done')}` : `⬇ ${t('focus.export.download')}`}
      </button>
    </div>
  );
}
