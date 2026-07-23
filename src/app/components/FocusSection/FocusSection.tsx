/**
 * =================================================================
 * src/app/components/FocusSection/FocusSection.tsx
 * -----------------------------------------------------------------
 * The "Focus" tab: shows the current Pomodoro cycle status, today's
 * completed sessions log, and productivity statistics fetched from
 * the `pomodoro_sessions` Supabase table.
 * =================================================================
 */

'use client';

import type { PomodoroPhase } from '@/app/hooks/usePomodoroEngine';
import type { SessionRow, TaskBreakdown } from '@/app/hooks/usePomodoroStats';
import styles from './FocusSection.module.css';
import { useLocale } from '@/app/lib/i18n';

interface FocusSectionProps {
  totalPomodorosToday: number;
  cycleCount: number;
  currentPhase: PomodoroPhase;
  dailyPomodoroGoal: number;
  todaySessions: SessionRow[];
  weekTotal: number;
  weeklyData: { label: string; count: number; isToday: boolean }[];
  streak: number;
  taskBreakdown: TaskBreakdown[];
  statsLoading: boolean;
  statsError: boolean;
  onStartWork: () => void;
  onStartBreak: () => void;
}

export default function FocusSection({
  totalPomodorosToday,
  cycleCount,
  currentPhase,
  dailyPomodoroGoal,
  todaySessions,
  weekTotal,
  weeklyData,
  streak,
  taskBreakdown,
  statsLoading,
  statsError,
  onStartWork,
  onStartBreak,
}: FocusSectionProps) {
  const { t } = useLocale();
  const loading = statsLoading;
  const loadError = statsError;

  const PHASE_LABELS: Record<PomodoroPhase, string> = {
    work: t('focus.cycle.phases.work'),
    short_break: t('focus.cycle.phases.short_break'),
    long_break: t('focus.cycle.phases.long_break'),
    idle: t('focus.cycle.phases.idle'),
  };

  // ---------------------------------------------------------------
  // Block A helpers
  // ---------------------------------------------------------------

  const renderCta = () => {
    switch (currentPhase) {
      case 'idle':
        return (
          <button className={styles.ctaButton} onClick={onStartWork} type="button">
            {totalPomodorosToday > 0 || cycleCount > 0
              ? t('focus.cycle.cta.startNext')
              : t('focus.cycle.cta.start')}
          </button>
        );
      case 'work':
        return (
          <button className={styles.ctaButton} disabled type="button">
            {t('focus.cycle.cta.working')}
          </button>
        );
      case 'short_break':
        return (
          <button className={styles.ctaButton} onClick={onStartBreak} type="button">
            {t('focus.cycle.cta.shortBreak')}
          </button>
        );
      case 'long_break':
        return (
          <button className={styles.ctaButton} onClick={onStartBreak} type="button">
            {t('focus.cycle.cta.longBreak')}
          </button>
        );
    }
  };

  const goal = dailyPomodoroGoal > 0 ? dailyPomodoroGoal : 1;
  const progressPct = Math.min(100, (totalPomodorosToday / goal) * 100);
  const dailyAverage = (weekTotal / 7).toFixed(1);

  const formatHHMM = (iso: string) => {
    const d = new Date(iso);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const weeklyMax = Math.max(0, ...weeklyData.map((d) => d.count));

  return (
    <div className={styles.focusSection}>
      {/* BLOCK A: current cycle status */}
      <section className={styles.block}>
        <h2 className={styles.blockTitle}>{t('focus.cycle.title')}</h2>
        <div className={styles.cycleDots}>
          {[0, 1, 2, 3].map((i) => {
            const filled = i < cycleCount;
            const active = currentPhase === 'work' && i === cycleCount;
            return (
              <span
                key={i}
                className={[
                  styles.cycleDot,
                  filled ? styles.cycleDotFilled : '',
                  active ? styles.cycleDotActive : '',
                ].join(' ')}
              />
            );
          })}
        </div>
        <p className={styles.phaseLabel}>{PHASE_LABELS[currentPhase]}</p>
        {renderCta()}
      </section>

      {/* BLOCK B: today's log */}
      <section className={styles.block}>
        <h2 className={styles.blockTitle}>{t('focus.log.title')}</h2>
        {loading ? (
          <>
            <div className={styles.skeleton} />
            <div className={styles.skeleton} />
            <div className={styles.skeleton} />
          </>
        ) : loadError ? (
          <p className={styles.errorText}>{t('focus.log.error')}</p>
        ) : todaySessions.length === 0 ? (
          <p className={styles.emptyState}>
            {t('focus.log.empty')}
          </p>
        ) : (
          <ul className={styles.logList}>
            {todaySessions.map((s, i) => (
              <li key={`${s.completed_at}-${i}`} className={styles.logItem}>
                <span className={styles.logTime}>{formatHHMM(s.completed_at)}</span>
                <span className={styles.logTask}>{s.task_text ?? t('focus.log.noTask')}</span>
                <span className={styles.logDuration}>{s.duration_minutes} min</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* BLOCK: last 7 days bar chart */}
      <section className={styles.block}>
        <h2 className={styles.blockTitle}>{t('focus.chart.title')}</h2>
        {loading ? (
          <>
            <div className={styles.skeleton} />
            <div className={styles.skeleton} />
            <div className={styles.skeleton} />
          </>
        ) : loadError ? (
          <p className={styles.errorText}>{t('focus.log.error')}</p>
        ) : (
          <div className={styles.weeklyChart}>
            {weeklyData.map((d, i) => {
              const heightPct = weeklyMax > 0 ? (d.count / weeklyMax) * 100 : 0;
              return (
                <div key={i} className={styles.weeklyColumn}>
                  <span
                    className={[
                      styles.weeklyCount,
                      d.count === 0 ? styles.weeklyCountZero : '',
                    ].join(' ')}
                  >
                    {d.count}
                  </span>
                  <div className={styles.weeklyBarTrack}>
                    <div
                      className={[
                        styles.weeklyBar,
                        d.isToday ? styles.weeklyBarToday : '',
                      ].join(' ')}
                      style={{ height: `max(4px, ${heightPct}%)` }}
                    />
                  </div>
                  <span
                    className={[
                      styles.weeklyLabel,
                      d.isToday ? styles.weeklyLabelToday : '',
                    ].join(' ')}
                  >
                    {d.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* BLOCK: task breakdown (last 7 days) */}
      <section className={styles.block}>
        <h2 className={styles.blockTitle}>{t('focus.taskBreakdown.title')}</h2>
        <p className={styles.taskBreakdownSubtitle}>{t('focus.taskBreakdown.subtitle')}</p>
        {loading ? (
          <>
            <div className={styles.skeleton} />
            <div className={styles.skeleton} />
            <div className={styles.skeleton} />
          </>
        ) : loadError ? (
          <p className={styles.errorText}>{t('focus.log.error')}</p>
        ) : taskBreakdown.length === 0 ? (
          <p className={styles.emptyState}>
            {t('focus.taskBreakdown.empty')}
          </p>
        ) : (
          <ul className={styles.taskBreakdownList}>
            {taskBreakdown.map((t, i) => (
              <li
                key={`${t.taskName}-${i}`}
                className={[
                  styles.taskBreakdownItem,
                  i === 0 ? styles.taskBreakdownItemTop : '',
                ].join(' ')}
              >
                <span className={styles.taskBreakdownRank}>{i + 1}</span>
                <span className={styles.taskBreakdownName}>{t.taskName}</span>
                <span className={styles.taskBreakdownCount}>{t.count} 🍅</span>
                <span className={styles.taskBreakdownTime}>{t.totalMinutes} min</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* BLOCK C: stats */}
      <section className={styles.block}>
        <h2 className={styles.blockTitle}>{t('focus.stats.title')}</h2>
        {loading ? (
          <>
            <div className={styles.skeleton} />
            <div className={styles.skeleton} />
            <div className={styles.skeleton} />
            <div className={styles.skeleton} />
          </>
        ) : loadError ? (
          <p className={styles.errorText}>{t('focus.log.error')}</p>
        ) : (
          <div className={styles.statsGrid}>
            <div className={styles.statRow}>
              <span>{t('focus.stats.today')}</span>
              <span className={styles.statValue}>
                {totalPomodorosToday} / {dailyPomodoroGoal}
              </span>
            </div>
            <div className={styles.progressTrack}>
              <div className={styles.progressFill} style={{ width: `${progressPct}%` }} />
            </div>
            <div className={styles.statRow}>
              <span>{t('focus.stats.thisWeek')}</span>
              <span className={styles.statValue}>{weekTotal}</span>
            </div>
            <div className={styles.statRow}>
              <span>{t('focus.stats.dailyAverage')}</span>
              <span className={styles.statValue}>{dailyAverage}</span>
            </div>
            <div className={styles.statRow}>
              <span>{t('focus.stats.currentStreak')}</span>
              <span className={styles.statValue}>
                {streak} {streak === 1 ? t('focus.stats.day') : t('focus.stats.days')}
              </span>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
