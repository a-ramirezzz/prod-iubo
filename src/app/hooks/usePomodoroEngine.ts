/**
 * =================================================================
 * src/app/hooks/usePomodoroEngine.ts
 * -----------------------------------------------------------------
 * This custom hook manages the Pomodoro cycle state machine:
 * how many pomodoros have been completed in the current cycle,
 * which phase the user is in (work / short break / long break),
 * and the daily total (persisted best-effort in Supabase).
 *
 * It does NOT auto-advance the timer — it only tracks state and
 * exposes actions; the user manually starts each phase.
 * =================================================================
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/app/lib/supabase/client';

// A valid Pomodoro is a work session of at least 20 minutes.
const MIN_VALID_POMODORO_SECONDS = 1200;
// A long break is earned after this many valid pomodoros.
const POMODOROS_PER_CYCLE = 4;

export type PomodoroPhase = 'work' | 'short_break' | 'long_break' | 'idle';

interface PomodoroEngineOptions {
  /** Fired when the 4th pomodoro of a cycle completes (long break earned). */
  onCycleComplete?: () => void;
}

/**
 * Manages the Pomodoro cycle state machine and best-effort session
 * persistence in the `pomodoro_sessions` Supabase table.
 * @param userId - The authenticated user's id, or null when signed out.
 * @param options - Optional callbacks (e.g. long-break notification).
 */
export const usePomodoroEngine = (
  userId: string | null,
  options: PomodoroEngineOptions = {}
) => {
  const supabase = createClient();

  const [cycleCount, setCycleCount] = useState(0);
  const [totalPomodorosToday, setTotalPomodorosToday] = useState(0);
  const [currentPhase, setCurrentPhase] = useState<PomodoroPhase>('idle');
  const [sessionStartedAt, setSessionStartedAt] = useState<Date | null>(null);

  // Refs so callbacks always see the latest values without re-creating.
  const initialTimeSetRef = useRef(0);
  const sessionStartedAtRef = useRef<Date | null>(null);
  const cycleCountRef = useRef(0);
  const currentPhaseRef = useRef<PomodoroPhase>('idle');
  const onCycleCompleteRef = useRef(options.onCycleComplete);
  useEffect(() => {
    onCycleCompleteRef.current = options.onCycleComplete;
  }, [options.onCycleComplete]);

  /**
   * On mount (and when the user changes): restore today's completed
   * pomodoro count from Supabase. Errors are swallowed — stats are
   * best-effort, never blocking.
   */
  useEffect(() => {
    if (!userId) {
      setTotalPomodorosToday(0);
      return;
    }
    let cancelled = false;
    const fetchToday = async () => {
      try {
        const todayMidnightUTC = new Date();
        todayMidnightUTC.setUTCHours(0, 0, 0, 0);
        const { count, error } = await supabase
          .from('pomodoro_sessions')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('session_type', 'work')
          .eq('completed', true)
          .gte('completed_at', todayMidnightUTC.toISOString());
        if (!cancelled && !error && typeof count === 'number') {
          setTotalPomodorosToday(count);
        }
      } catch {
        // Silent: stats are non-critical.
      }
    };
    fetchToday();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  /**
   * Begins a work session: records the phase, start time, and the
   * initially set duration (used later to validate the pomodoro).
   */
  const startWorkSession = useCallback((initialTimeSet: number) => {
    const now = new Date();
    initialTimeSetRef.current = initialTimeSet;
    sessionStartedAtRef.current = now;
    setSessionStartedAt(now);
    currentPhaseRef.current = 'work';
    setCurrentPhase('work');
  }, []);

  /**
   * Called when the timer reaches zero naturally (via useTimer's
   * onComplete). Validates and persists the pomodoro, then advances
   * the cycle state machine.
   */
  const completeSession = useCallback((taskText: string | null) => {
    if (
      currentPhaseRef.current !== 'work' ||
      initialTimeSetRef.current < MIN_VALID_POMODORO_SECONDS
    ) {
      return; // Not a valid pomodoro — no state change.
    }

    // Persist the session (best-effort, fire-and-forget).
    if (userId) {
      supabase
        .from('pomodoro_sessions')
        .insert({
          user_id: userId,
          started_at: (sessionStartedAtRef.current ?? new Date()).toISOString(),
          completed_at: new Date().toISOString(),
          duration_minutes: Math.round(initialTimeSetRef.current / 60),
          session_type: 'work',
          task_text: taskText,
          completed: true,
        })
        .then(({ error }) => {
          if (error) console.error('[usePomodoroEngine] Error saving session:', error);
        });
    }

    setTotalPomodorosToday((prev) => prev + 1);

    const newCycleCount = cycleCountRef.current + 1;
    if (newCycleCount >= POMODOROS_PER_CYCLE) {
      cycleCountRef.current = 0;
      setCycleCount(0);
      currentPhaseRef.current = 'long_break';
      setCurrentPhase('long_break');
      onCycleCompleteRef.current?.();
    } else {
      cycleCountRef.current = newCycleCount;
      setCycleCount(newCycleCount);
      currentPhaseRef.current = 'short_break';
      setCurrentPhase('short_break');
    }
  }, [userId, supabase]);

  /**
   * Starts the break the user has earned. Breaks are not persisted —
   * only work sessions are saved.
   */
  const startBreak = useCallback(() => {
    sessionStartedAtRef.current = new Date();
    const breakType: PomodoroPhase =
      currentPhaseRef.current === 'long_break' ? 'long_break' : 'short_break';
    currentPhaseRef.current = breakType;
    setCurrentPhase(breakType);
  }, []);

  /**
   * Ends the current break; the user will manually start the next
   * work session.
   */
  const completeBreak = useCallback(() => {
    currentPhaseRef.current = 'idle';
    setCurrentPhase('idle');
  }, []);

  /**
   * Resets the current cycle entirely.
   */
  const resetCycle = useCallback(() => {
    cycleCountRef.current = 0;
    setCycleCount(0);
    currentPhaseRef.current = 'idle';
    setCurrentPhase('idle');
    setSessionStartedAt(null);
    sessionStartedAtRef.current = null;
  }, []);

  return {
    currentPhase,
    cycleCount,
    totalPomodorosToday,
    sessionStartedAt,
    startWorkSession,
    completeSession,
    startBreak,
    completeBreak,
    resetCycle,
  };
};
