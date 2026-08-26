// Copyright (c) 2025 Alan Rodrigo Ramírez Luna (@a-ramirezzz)
// Licensed under CC BY-NC-ND 4.0 — https://creativecommons.org/licenses/by-nc-nd/4.0/
// src/app/components/StatsMetricsGrid/StatsMetricsGrid.tsx

'use client';

import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import styles from './StatsMetricsGrid.module.css';
import { useLocale } from '@/app/lib/i18n';
import { useCrossfadeVariants, useStaggerContainerVariants } from '@/app/lib/motion';

interface StatsMetricsGridProps {
  bestDayOfWeek: { day: number; count: number };
  peakHour: { hour: number; count: number };
  longestStreak: number;
  averageDaily: number;
  totalSessions: number;
  totalMinutes: number;
  loading: boolean;
  loadError: boolean;
}

function formatHoursMinutes(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
}

function StatsMetricsGrid({
  bestDayOfWeek,
  peakHour,
  longestStreak,
  averageDaily,
  totalSessions,
  totalMinutes,
  loading,
  loadError,
}: StatsMetricsGridProps) {
  const { t, locale } = useLocale();
  const containerVariants = useStaggerContainerVariants(0.05);
  const cardVariants = useCrossfadeVariants(8);
  const dateLocale = locale === 'es' ? 'es-ES' : 'en-US';
  const hasData = totalSessions > 0;

  const bestDayLabel = useMemo(() => {
    if (!hasData) return t('focus.metrics.noData');
    const formatter = new Intl.DateTimeFormat(dateLocale, { weekday: 'long' });
    const reference = new Date();
    reference.setDate(reference.getDate() - reference.getDay() + bestDayOfWeek.day);
    const label = formatter.format(reference);
    return label.charAt(0).toUpperCase() + label.slice(1);
  }, [hasData, dateLocale, bestDayOfWeek.day, t]);

  const peakHourLabel = useMemo(() => {
    if (!hasData) return t('focus.metrics.noData');
    const formatter = new Intl.DateTimeFormat(dateLocale, { hour: 'numeric' });
    const start = new Date();
    start.setHours(peakHour.hour, 0, 0, 0);
    const end = new Date();
    end.setHours((peakHour.hour + 1) % 24, 0, 0, 0);
    return `${formatter.format(start)} - ${formatter.format(end)}`;
  }, [hasData, dateLocale, peakHour.hour, t]);

  const sessionsSubtitle = (count: number) =>
    t('focus.metrics.sessionsSubtitle').replace('{count}', String(count));

  const totalHoursLabel = (totalMinutes / 60).toFixed(1);

  const cards = [
    {
      icon: '📅',
      label: t('focus.metrics.bestDay.label'),
      value: bestDayLabel,
      subtitle: hasData ? sessionsSubtitle(bestDayOfWeek.count) : t('focus.metrics.noData'),
    },
    {
      icon: '⏰',
      label: t('focus.metrics.peakHour.label'),
      value: peakHourLabel,
      subtitle: hasData ? sessionsSubtitle(peakHour.count) : t('focus.metrics.noData'),
    },
    {
      icon: '🔥',
      label: t('focus.metrics.longestStreak.label'),
      value: `${longestStreak} ${longestStreak === 1 ? t('focus.stats.day') : t('focus.stats.days')}`,
      subtitle: t('focus.metrics.longestStreak.subtitle'),
    },
    {
      icon: '📊',
      label: t('focus.metrics.averageDaily.label'),
      value: hasData ? averageDaily.toFixed(1) : '0',
      subtitle: t('focus.metrics.averageDaily.subtitle'),
    },
    {
      icon: '✅',
      label: t('focus.metrics.totalSessions.label'),
      value: String(totalSessions),
      subtitle: t('focus.metrics.totalSessions.subtitle').replace('{hours}', totalHoursLabel),
    },
    {
      icon: '⏱️',
      label: t('focus.metrics.totalFocusTime.label'),
      value: formatHoursMinutes(totalMinutes),
      subtitle: t('focus.metrics.totalFocusTime.subtitle'),
    },
  ];

  return (
    <section className={styles.block}>
      <h2 className={styles.blockTitle}>{t('focus.metrics.title')}</h2>
      {loading ? (
        <div className={styles.skeletonGrid}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={styles.skeleton} />
          ))}
        </div>
      ) : loadError ? (
        <p className={styles.errorText}>{t('focus.log.error')}</p>
      ) : (
        <motion.div
          className={styles.grid}
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          {cards.map((c, i) => (
            <motion.div key={i} className={styles.card} variants={cardVariants}>
              <span className={styles.cardIcon} aria-hidden="true">
                {c.icon}
              </span>
              <span className={styles.cardLabel}>{c.label}</span>
              <span className={styles.cardValue}>{c.value}</span>
              <span className={styles.cardSubtitle}>{c.subtitle}</span>
            </motion.div>
          ))}
        </motion.div>
      )}
    </section>
  );
}

export default memo(StatsMetricsGrid);
