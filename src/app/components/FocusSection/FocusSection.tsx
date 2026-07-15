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

import { useState, useEffect } from 'react';
import { createClient } from '@/app/lib/supabase/client';
import type { PomodoroPhase } from '@/app/hooks/usePomodoroEngine';
import styles from './FocusSection.module.css';

interface SessionRow {
  completed_at: string;
  task_text: string | null;
  duration_minutes: number;
}

interface FocusSectionProps {
  totalPomodorosToday: number;
  cycleCount: number;
  currentPhase: PomodoroPhase;
  dailyPomodoroGoal: number;
  userId: string | null;
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
  userId,
  onStartWork,
  onStartBreak,
}: FocusSectionProps) {
  const [todaySessions, setTodaySessions] = useState<SessionRow[]>([]);
  const [weekTotal, setWeekTotal] = useState(0);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  /**
   * Fetch today's log and the last 30 days of sessions in a single
   * query on mount; derive week total, daily average and streak.
   */
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    const fetchStats = async () => {
      setLoading(true);
      setLoadError(false);
      try {
        const monthAgo = new Date();
        monthAgo.setUTCDate(monthAgo.getUTCDate() - 30);
        monthAgo.setUTCHours(0, 0, 0, 0);

        const { data, error } = await createClient()
          .from('pomodoro_sessions')
          .select('completed_at, task_text, duration_minutes')
          .eq('user_id', userId)
          .eq('session_type', 'work')
          .eq('completed', true)
          .gte('completed_at', monthAgo.toISOString())
          .order('completed_at', { ascending: false });

        if (cancelled) return;
        if (error || !data) {
          setLoadError(true);
          return;
        }

        const rows = data as SessionRow[];
        const now = new Date();

        const todayMidnight = new Date();
        todayMidnight.setHours(0, 0, 0, 0);
        setTodaySessions(
          rows.filter((r) => new Date(r.completed_at) >= todayMidnight)
        );

        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        setWeekTotal(
          rows.filter((r) => new Date(r.completed_at) >= weekAgo).length
        );

        // Streak: consecutive days (backwards from today) with >= 1 pomodoro.
        const localDateStr = (d: Date) =>
          `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const daysWithSessions = new Set(
          rows.map((r) => localDateStr(new Date(r.completed_at)))
        );
        let streakCount = 0;
        for (let i = 0; i < 30; i++) {
          const day = new Date(todayMidnight.getTime() - i * 24 * 60 * 60 * 1000);
          if (daysWithSessions.has(localDateStr(day))) {
            streakCount++;
          } else if (i === 0) {
            continue; // Today without sessions yet doesn't break the streak.
          } else {
            break;
          }
        }
        setStreak(streakCount);
      } catch {
        if (!cancelled) setLoadError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchStats();
    return () => {
      cancelled = true;
    };
  }, [userId, totalPomodorosToday]);

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
