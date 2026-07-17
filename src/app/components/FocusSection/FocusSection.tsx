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
import type { SessionRow } from '@/app/hooks/usePomodoroStats';
import styles from './FocusSection.module.css';

interface FocusSectionProps {
  totalPomodorosToday: number;
  cycleCount: number;
  currentPhase: PomodoroPhase;
  dailyPomodoroGoal: number;
  todaySessions: SessionRow[];
  weekTotal: number;
  weeklyData: { label: string; count: number; isToday: boolean }[];
  streak: number;
  statsLoading: boolean;
  statsError: boolean;
  onStartWork: () => void;
  onStartBreak: () => void;
}

const PHASE_LABELS: Record<PomodoroPhase, string> = {
  work: 'Trabajando',
  short_break: 'Pausa corta',
  long_break: 'Pausa larga',
  idle: 'Listo para comenzar',
};

export default function FocusSection({
  totalPomodorosToday,
  cycleCount,
  currentPhase,
  dailyPomodoroGoal,
  todaySessions,
  weekTotal,
  weeklyData,
  streak,
  statsLoading,
  statsError,
  onStartWork,
  onStartBreak,
}: FocusSectionProps) {
  const loading = statsLoading;
  const loadError = statsError;

  // ---------------------------------------------------------------
  // Block A helpers
  // ---------------------------------------------------------------

  const renderCta = () => {
    switch (currentPhase) {
      case 'idle':
        return (
          <button className={styles.ctaButton} onClick={onStartWork} type="button">
            {totalPomodorosToday > 0 || cycleCount > 0
              ? 'Iniciar siguiente Pomodoro'
              : 'Iniciar Pomodoro'}
          </button>
        );
      case 'work':
        return (
          <button className={styles.ctaButton} disabled type="button">
            En sesión de trabajo...
          </button>
        );
      case 'short_break':
        return (
          <button className={styles.ctaButton} onClick={onStartBreak} type="button">
            Iniciar Pausa Corta (5 min)
          </button>
        );
      case 'long_break':
        return (
          <button className={styles.ctaButton} onClick={onStartBreak} type="button">
            Iniciar Pausa Larga (15 min)
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
        <h2 className={styles.blockTitle}>Ciclo actual</h2>
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
        <h2 className={styles.blockTitle}>Hoy</h2>
        {loading ? (
          <>
            <div className={styles.skeleton} />
            <div className={styles.skeleton} />
            <div className={styles.skeleton} />
          </>
        ) : loadError ? (
          <p className={styles.errorText}>No se pudieron cargar las estadísticas</p>
        ) : todaySessions.length === 0 ? (
          <p className={styles.emptyState}>
            Aún no has completado ningún pomodoro hoy. ¡Empieza tu primera sesión!
          </p>
        ) : (
          <ul className={styles.logList}>
            {todaySessions.map((s, i) => (
              <li key={`${s.completed_at}-${i}`} className={styles.logItem}>
                <span className={styles.logTime}>{formatHHMM(s.completed_at)}</span>
                <span className={styles.logTask}>{s.task_text ?? 'Sin tarea'}</span>
                <span className={styles.logDuration}>{s.duration_minutes} min</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* BLOCK: last 7 days bar chart */}
      <section className={styles.block}>
        <h2 className={styles.blockTitle}>Últimos 7 días</h2>
        {loading ? (
          <>
            <div className={styles.skeleton} />
            <div className={styles.skeleton} />
            <div className={styles.skeleton} />
          </>
        ) : loadError ? (
          <p className={styles.errorText}>No se pudieron cargar las estadísticas</p>
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

      {/* BLOCK C: stats */}
      <section className={styles.block}>
        <h2 className={styles.blockTitle}>Estadísticas</h2>
        {loading ? (
          <>
            <div className={styles.skeleton} />
            <div className={styles.skeleton} />
            <div className={styles.skeleton} />
            <div className={styles.skeleton} />
          </>
        ) : loadError ? (
          <p className={styles.errorText}>No se pudieron cargar las estadísticas</p>
        ) : (
          <div className={styles.statsGrid}>
            <div className={styles.statRow}>
              <span>Hoy</span>
              <span className={styles.statValue}>
                {totalPomodorosToday} / {dailyPomodoroGoal}
              </span>
            </div>
            <div className={styles.progressTrack}>
              <div className={styles.progressFill} style={{ width: `${progressPct}%` }} />
            </div>
            <div className={styles.statRow}>
              <span>Esta semana</span>
              <span className={styles.statValue}>{weekTotal}</span>
            </div>
            <div className={styles.statRow}>
              <span>Promedio diario</span>
              <span className={styles.statValue}>{dailyAverage}</span>
            </div>
            <div className={styles.statRow}>
              <span>Racha actual</span>
              <span className={styles.statValue}>
                {streak} {streak === 1 ? 'día' : 'días'}
              </span>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
