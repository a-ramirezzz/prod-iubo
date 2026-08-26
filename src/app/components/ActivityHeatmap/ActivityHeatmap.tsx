// Copyright (c) 2025 Alan Rodrigo Ramírez Luna (@a-ramirezzz)
// Licensed under CC BY-NC-ND 4.0 — https://creativecommons.org/licenses/by-nc-nd/4.0/
// src/app/components/ActivityHeatmap/ActivityHeatmap.tsx

'use client';

import { memo, useLayoutEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import styles from './ActivityHeatmap.module.css';
import { useLocale } from '@/app/lib/i18n';
import { useCrossfadeVariants } from '@/app/lib/motion';

interface ActivityHeatmapProps {
  dailyCounts: Record<string, number>;
  loading: boolean;
  loadError: boolean;
}

interface DayCell {
  date: Date;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
  inRange: boolean;
}

const localDateKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Days since Monday: 0 = Monday ... 6 = Sunday. */
const mondayOffset = (d: Date) => (d.getDay() + 6) % 7;

function levelFor(count: number): DayCell['level'] {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count <= 3) return 2;
  if (count <= 5) return 3;
  return 4;
}

/** Builds a Monday-first grid covering the last 365 days, padded out to full weeks. */
function buildWeeks(dailyCounts: Record<string, number>): DayCell[][] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const rangeStart = new Date(today);
  rangeStart.setDate(rangeStart.getDate() - 364);

  const gridStart = new Date(rangeStart);
  gridStart.setDate(gridStart.getDate() - mondayOffset(rangeStart));
  const gridEnd = new Date(today);
  gridEnd.setDate(gridEnd.getDate() + (6 - mondayOffset(today)));

  const weeks: DayCell[][] = [];
  let week: DayCell[] = [];
  const cursor = new Date(gridStart);
  while (cursor <= gridEnd) {
    const inRange = cursor >= rangeStart && cursor <= today;
    const count = inRange ? (dailyCounts[localDateKey(cursor)] ?? 0) : 0;
    week.push({ date: new Date(cursor), count, level: levelFor(count), inRange });
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return weeks;
}

function ActivityHeatmap({ dailyCounts, loading, loadError }: ActivityHeatmapProps) {
  const { t, locale } = useLocale();
  const crossfade = useCrossfadeVariants();
  const dateLocale = locale === 'es' ? 'es-ES' : 'en-US';

  const weeks = useMemo(() => buildWeeks(dailyCounts), [dailyCounts]);

  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Show the current month by default, like GitHub's contribution graph,
  // instead of scrolling to the oldest (leftmost) data.
  useLayoutEffect(() => {
    const el = scrollAreaRef.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [weeks]);

  const monthLabels = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(dateLocale, { month: 'short' });
    return weeks.reduce<{ lastMonth: number; labels: string[] }>(
      (acc, week) => {
        const month = week[0].date.getMonth();
        if (month === acc.lastMonth) {
          acc.labels.push('');
        } else {
          acc.labels.push(formatter.format(week[0].date));
          acc.lastMonth = month;
        }
        return acc;
      },
      { lastMonth: -1, labels: [] }
    ).labels;
  }, [weeks, dateLocale]);

  const dayLabels = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(dateLocale, { weekday: 'short' });
    const referenceWeek = weeks[weeks.length - 1] ?? weeks[0];
    if (!referenceWeek) return ['', '', '', '', '', '', ''];
    return referenceWeek.map((day, i) => (i === 0 || i === 2 || i === 4 ? formatter.format(day.date) : ''));
  }, [weeks, dateLocale]);

  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat(dateLocale, { day: 'numeric', month: 'short', year: 'numeric' }),
    [dateLocale]
  );

  const tooltipFor = (cell: DayCell) => {
    const key = cell.count === 1 ? 'focus.heatmap.tooltipOne' : 'focus.heatmap.tooltipMany';
    return t(key)
      .replace('{count}', String(cell.count))
      .replace('{date}', dateFormatter.format(cell.date));
  };

  return (
    <section className={styles.block}>
      <h2 className={styles.blockTitle}>{t('focus.heatmap.title')}</h2>
      {loading ? (
        <div className={styles.skeleton} />
      ) : loadError ? (
        <p className={styles.errorText}>{t('focus.log.error')}</p>
      ) : (
        <>
          <div className={styles.scrollArea} ref={scrollAreaRef}>
            <div className={styles.grid}>
              <div className={styles.dayLabelsCol}>
                <span className={styles.monthSpacer} aria-hidden="true" />
                {dayLabels.map((label, i) => (
                  <span key={i} className={styles.dayLabel}>
                    {label}
                  </span>
                ))}
              </div>
              <motion.div
                className={styles.weeksArea}
                initial="hidden"
                animate="visible"
                variants={crossfade}
              >
                <div className={styles.monthRow}>
                  {monthLabels.map((label, i) => (
                    <span key={i} className={styles.monthLabel}>
                      {label}
                    </span>
                  ))}
                </div>
                <div className={styles.weeksRow}>
                  {weeks.map((week, wi) => (
                    <div key={wi} className={styles.weekCol}>
                      {week.map((day, di) =>
                        day.inRange ? (
                          <span
                            key={di}
                            className={[styles.cell, styles[`level${day.level}`]].join(' ')}
                            title={tooltipFor(day)}
                          />
                        ) : (
                          <span key={di} className={styles.cellPad} aria-hidden="true" />
                        )
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
          <div className={styles.legend}>
            <span className={styles.legendLabel}>{t('focus.heatmap.legendLess')}</span>
            {([0, 1, 2, 3, 4] as const).map((level) => (
              <span
                key={level}
                className={[styles.legendCell, styles[`level${level}`]].join(' ')}
              />
            ))}
            <span className={styles.legendLabel}>{t('focus.heatmap.legendMore')}</span>
          </div>
        </>
      )}
    </section>
  );
}

export default memo(ActivityHeatmap);
